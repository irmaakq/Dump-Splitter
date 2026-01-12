/* eslint-disable no-restricted-globals */

// AI WORKER - TILE BASED ARCHITECTURE (TFJS)
// Solves RAM/GPU Crashes by processing images in small chunks.
// No manual downloads required.

importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
importScripts('https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@upscalerjs/default-model@latest/dist/umd/index.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/dist/umd/models/esrgan-thick/src/umd.min.js');

let upscaler4x = null;
let upscaler2x = null;

// --- CONFIG ---
const TILE_SIZE = 128; // 128x128 input tiles -> Stable performance
const PAD = 16;        // Padding to avoid seams

// --- INIT ---

const initModels = async (type) => {
    try {
        await tf.setBackend('webgl');
        await tf.ready();

        if (type === '4x' && !upscaler4x) {
            console.log("Loading 4X Model...");
            const esrganLib = self.EsrganThick || self.ESRGANThick;
            if (!esrganLib) throw new Error("4X Kütüphanesi Yüklenemedi (İnternet bağlantınızı kontrol edin)");

            upscaler4x = new Upscaler({
                model: esrganLib.ESRGANThick4x || esrganLib,
            });
        }

        if (type === '2x' && !upscaler2x) {
            console.log("Loading 2X Model...");
            upscaler2x = new Upscaler({
                model: self.DefaultUpscalerJSModel,
            });
        }
    } catch (e) {
        throw new Error(`Model Yükleme Hatası (${type}): ${e.message}`);
    }
};

// --- TILING PIPELINE (The Magic Fix) ---

const processTiled = async (imageData, modelType, id) => {
    const upscaler = modelType === '4x' ? upscaler4x : upscaler2x;
    const scale = modelType === '4x' ? 4 : 2;

    // Convert source to Tensor to slice easily
    const fullTensor = tf.browser.fromPixels(imageData);
    const [h, w] = fullTensor.shape;

    const outW = w * scale;
    const outH = h * scale;
    const finalBuffer = new Uint8ClampedArray(outW * outH * 4);

    const cols = Math.ceil(w / TILE_SIZE);
    const rows = Math.ceil(h / TILE_SIZE);
    const totalTiles = cols * rows;
    let processed = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            processed++;
            if (processed % 2 === 0 || processed === totalTiles) {
                self.postMessage({ type: 'progress', message: `İşleniyor: %${Math.round(processed / totalTiles * 100)}`, id });
                await new Promise(res => setTimeout(res, 0)); // Yield
            }

            // 1. Calc Bounds
            const srcX = c * TILE_SIZE;
            const srcY = r * TILE_SIZE;

            const x1 = Math.max(0, srcX - PAD);
            const y1 = Math.max(0, srcY - PAD);
            const x2 = Math.min(w, srcX + TILE_SIZE + PAD);
            const y2 = Math.min(h, srcY + TILE_SIZE + PAD);

            const tileH = y2 - y1;
            const tileW = x2 - x1;

            if (tileW <= 0 || tileH <= 0) continue;

            const tileTensor = tf.tidy(() => {
                return fullTensor.slice([y1, x1, 0], [tileH, tileW, 3]);
            });

            // 2. Upscale
            let resultTensor;
            try {
                // UpscalerJS expects 0-255 int tensor or 0-1 float. It handles auto-normalization usually.
                // We pass the raw tensor (0-255).
                resultTensor = await upscaler.upscale(tileTensor, {
                    output: 'tensor',
                    patchSize: undefined, // We are doing manual tiling
                    padding: 0
                });
            } catch (err) {
                tileTensor.dispose();
                fullTensor.dispose();
                throw new Error(`Tile Hatası: ${err.message}`);
            }

            // 3. To Pixels
            const tileBytes = await tf.browser.toPixels(resultTensor);

            tileTensor.dispose();
            resultTensor.dispose();

            // 4. Stitch
            const validInX = (srcX - x1);
            const validInY = (srcY - y1);
            const validW = Math.min(TILE_SIZE, w - srcX);
            const validH = Math.min(TILE_SIZE, h - srcY);

            // Scale to output
            const targetX = srcX * scale;
            const targetY = srcY * scale;
            const upscaledTileW = tileW * scale;

            const writeW = validW * scale;
            const writeH = validH * scale;
            const readOffX = validInX * scale;
            const readOffY = validInY * scale;

            for (let row = 0; row < writeH; row++) {
                const srcIdx = ((readOffY + row) * upscaledTileW + readOffX) * 4;
                const dstIdx = ((targetY + row) * outW + targetX) * 4;

                // Copy row
                const line = tileBytes.subarray(srcIdx, srcIdx + (writeW * 4));
                finalBuffer.set(line, dstIdx);
            }
        }
    }

    fullTensor.dispose();
    return { width: outW, height: outH, data: finalBuffer };
}


self.onmessage = async (e) => {
    const { type, imageData, id, modelType } = e.data;
    const target = modelType || '2x';

    try {
        if (type === 'MakeModelReady') {
            await initModels(target);
            self.postMessage({ type: 'ready', id });
            return;
        }

        if (type === 'Upscale') {
            self.postMessage({ type: 'progress', message: 'Model Hazırlanıyor...', id });
            await initModels(target);

            self.postMessage({ type: 'progress', message: 'İşleniyor...', id });
            const result = await processTiled(imageData, target, id);

            self.postMessage({ type: 'complete', result, id }, [result.data.buffer]);
        }
    } catch (err) {
        console.error(err);
        self.postMessage({ type: 'error', error: err.message, id });
    }
};
