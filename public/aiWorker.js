/* eslint-disable no-restricted-globals */

// CLIENT-SIDE 4X UPSCALING WORKER (Production Grade)
// Stack: TensorFlow.js + UpscalerJS + Tiled Inference Pipeline

// 1. STABLE IMPORTS (Updated to working Unpkg paths)
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
importScripts('https://unpkg.com/upscaler@latest/dist/browser/umd/upscaler.min.js');
importScripts('https://unpkg.com/@upscalerjs/default-model@latest/dist/umd/index.min.js');
importScripts('https://unpkg.com/@upscalerjs/esrgan-thick@latest/dist/umd/models/esrgan-thick/src/umd.min.js');

// 2. CONFIGURATION
const CONFIG = {
    TILE_SIZE: 128,      // 128x128 chunks (Safe for 8GB RAM)
    PADDING: 16,         // Overlap to prevent seam artifacts
    TENSOR_CLEANUP: true // Aggressive memory cleanup
};

// 3. STATE
let upscaler4x = null;
let upscaler2x = null;
let isWarmedUp = false;

// --- INITIALIZATION & WARMUP ---

const initModels = async (type) => {
    // Check if valid type
    if (type !== '4x' && type !== '2x') throw new Error("Geçersiz model tipi.");

    await tf.setBackend('webgl');
    await tf.ready();

    if (type === '4x') {
        if (!upscaler4x) {
            console.log("Worker: Loading 4X Model (ESRGAN)...");
            const esrganLib = self.EsrganThick || self.ESRGANThick;
            if (!esrganLib) throw new Error("4X Kütüphanesi Yüklenemedi.");

            upscaler4x = new Upscaler({
                model: esrganLib.ESRGANThick4x || esrganLib,
            });
            await warmup(upscaler4x);
        }
    } else {
        if (!upscaler2x) {
            console.log("Worker: Loading 2X Model (Default)...");
            upscaler2x = new Upscaler({
                model: self.DefaultUpscalerJSModel,
            });
            await warmup(upscaler2x);
        }
    }
};

const warmup = async (model) => {
    if (isWarmedUp) return;
    try {
        console.log("Worker: Warming up GPU shaders...");
        // 1x1 dummy inference to compile shaders
        const dummy = tf.zeros([1, 16, 16, 3]);
        await model.upscale(dummy);
        dummy.dispose();
        isWarmedUp = true;
        console.log("Worker: Warmup complete.");
    } catch (e) {
        console.warn("Worker: Warmup warning:", e);
    }
};

// --- TILED INFERENCE PIPELINE ---

const processTiled = async (imageData, modelType, id) => {
    const upscaler = modelType === '4x' ? upscaler4x : upscaler2x;
    const scale = modelType === '4x' ? 4 : 2;

    // Create Tensor from raw pixel data
    const fullTensor = tf.browser.fromPixels(imageData);
    const [h, w] = fullTensor.shape;

    // Output dimensions
    const outW = w * scale;
    const outH = h * scale;

    // Pre-allocate buffer for result (No intermediate large tensors)
    const finalBuffer = new Uint8ClampedArray(outW * outH * 4);

    // Grid Calculation
    const cols = Math.ceil(w / CONFIG.TILE_SIZE);
    const rows = Math.ceil(h / CONFIG.TILE_SIZE);
    const totalTiles = cols * rows;

    let processed = 0;

    // --- MAIN TILING LOOP ---
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            processed++;

            // 1. Calculate Input Bounds (with Padding)
            const srcX = c * CONFIG.TILE_SIZE;
            const srcY = r * CONFIG.TILE_SIZE;

            const x1 = Math.max(0, srcX - CONFIG.PADDING);
            const y1 = Math.max(0, srcY - CONFIG.PADDING);
            const x2 = Math.min(w, srcX + CONFIG.TILE_SIZE + CONFIG.PADDING);
            const y2 = Math.min(h, srcY + CONFIG.TILE_SIZE + CONFIG.PADDING);

            const tileW = x2 - x1;
            const tileH = y2 - y1;

            if (tileW <= 0 || tileH <= 0) continue;

            // 2. Extract Tile Tensor (Normalize to 0-1 and CLIP strictly)
            const tileTensor = tf.tidy(() => {
                return fullTensor
                    .slice([y1, x1, 0], [tileH, tileW, 3])
                    .div(255.0)
                    .clipByValue(0.0, 1.0); // Force strict 0-1 range
            });

            // DEBUG: Check range
            /*
            const minVal = tileTensor.min().dataSync()[0];
            const maxVal = tileTensor.max().dataSync()[0];
            if (maxVal > 1.0 || minVal < 0.0) {
                 console.warn(`Tile ${r},${c} OOB: [${minVal}, ${maxVal}]`);
            }
            */

            // 3. Inference
            let upscaledTensor;
            try {
                upscaledTensor = await upscaler.upscale(tileTensor, {
                    output: 'tensor',
                    patchSize: undefined, // Manual tiling handles this
                    padding: 0
                });
            } catch (err) {
                // Determine if it's a range error
                const min = tileTensor.min().dataSync()[0];
                const max = tileTensor.max().dataSync()[0];
                tileTensor.dispose();
                throw new Error(`Upscale Fail (Tile ${r},${c}): ${err.message} [Input Range: ${min.toFixed(4)} - ${max.toFixed(4)}]`);
            }

            // 4. Download to CPU (GPU -> CPU Sync)
            const tileBytes = await tf.browser.toPixels(upscaledTensor);

            // 5. Cleanup (Crucial for 8GB RAM constraint)
            tileTensor.dispose();
            upscaledTensor.dispose();

            // 6. Stitching (Crop padding and place in buffer)
            // Determine valid region in Input Space
            const validInX = (srcX - x1);
            const validInY = (srcY - y1);
            const validW = Math.min(CONFIG.TILE_SIZE, w - srcX);
            const validH = Math.min(CONFIG.TILE_SIZE, h - srcY);

            // Map to Output Space
            const targetX = srcX * scale;
            const targetY = srcY * scale;
            const upscaledTileW = tileW * scale;

            const writeW = validW * scale;
            const writeH = validH * scale;
            const readOffX = validInX * scale;
            const readOffY = validInY * scale;

            // Copy Row-by-Row
            for (let row = 0; row < writeH; row++) {
                const srcIdx = ((readOffY + row) * upscaledTileW + readOffX) * 4;
                const dstIdx = ((targetY + row) * outW + targetX) * 4;

                // Fast Memory Block Copy
                const line = tileBytes.subarray(srcIdx, srcIdx + (writeW * 4));
                finalBuffer.set(line, dstIdx);
            }
        }

        // Report Progress (Throttled: Once per row)
        const percent = Math.round((processed / totalTiles) * 100);
        self.postMessage({
            type: 'progress',
            message: `İşleniyor: %${percent}`,
            progress: percent,
            id
        });

        // Yield to Event Loop (Keep browser responsive)
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    fullTensor.dispose();

    // Force Garbage Collection hint (browser dependent, but good practice in lengthy tasks)
    if (CONFIG.TENSOR_CLEANUP) {
        tf.disposeVariables();
    }

    return {
        width: outW,
        height: outH,
        data: finalBuffer
    };
};

// --- WORKER MESSAGING ---

self.onmessage = async (e) => {
    const { type, imageData, id, modelType } = e.data;

    try {
        if (type === 'MakeModelReady') {
            await initModels(modelType || '2x');
            self.postMessage({ type: 'ready', id });
            return;
        }

        if (type === 'Upscale') {
            const target = modelType || '2x';

            self.postMessage({ type: 'progress', message: 'Model Hazırlanıyor...', id });
            await initModels(target);

            self.postMessage({ type: 'progress', message: 'İşleniyor...', id });

            const start = performance.now();
            const result = await processTiled(imageData, target, id);
            const end = performance.now();

            console.log(`Worker: Upscale finished in ${((end - start) / 1000).toFixed(2)}s`);

            // Zero-copy transfer of large buffer
            self.postMessage(
                { type: 'complete', result, id },
                [result.data.buffer]
            );
        }
    } catch (err) {
        console.error("Worker Error:", err);
        self.postMessage({ type: 'error', error: err.message, id });
    }
};
