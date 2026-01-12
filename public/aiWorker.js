/* eslint-disable no-restricted-globals */

// AI WORKER - Handles heavy TensorFlow.js / Upscaler.js operations
// Uses Lazy Loading to prevent one broken model from crashing the entire worker.

let upscaler = null;
let currentModelType = null; // '2x' or '4x'
let tfLoaded = false;
let upscalerLoaded = false;

// 1. Core Libraries (Load these immediately or on first use)
const loadCore = () => {
    if (tfLoaded && upscalerLoaded) return;

    try {
        if (!self.tf) {
            importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
            tfLoaded = true;
        }
        if (!self.Upscaler) {
            importScripts('https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js');
            upscalerLoaded = true;
        }
    } catch (e) {
        throw new Error("Temel AI Kütüphaneleri (TensorFlow/Upscaler) Yüklenemedi: " + e.message);
    }
};

// 2. Model Specific Loading
const initModel = async (modelType = '2x') => {
    try {
        loadCore(); // Ensure core is ready

        // If we already have the correct model loaded, do nothing
        if (upscaler && currentModelType === modelType) return;

        // Dispose previous model if exists
        if (upscaler) {
            try {
                await tf.disposeVariables();
            } catch (e) { console.warn("Cleanup warning:", e); }
            upscaler = null;
        }

        await tf.setBackend('webgl');
        await tf.ready();

        let selectedModel;

        // Dynamically load the requested model script
        if (modelType === '4x') {
            if (!self.EsrganThick) {
                console.log("Loading 4X Model Script...");
                // Use JSDelivr for better stability
                importScripts('https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/dist/umd/models/esrgan-thick/src/umd.min.js');
            }
            // Check if loaded correctly
            if (!self.EsrganThick && !self.ESRGANThick) throw new Error("4X Model Script yüklendi ama 'EsrganThick' bulunamadı.");
            const esrganLib = self.EsrganThick || self.ESRGANThick;
            // The UMD bundle exports { ESRGANThick2x, ESRGANThick4x, ... }
            selectedModel = esrganLib.ESRGANThick4x || esrganLib;

            // Explicit check to ensure we aren't using a null/undefined model
            if (!selectedModel) throw new Error("4X Model Nesnesi Bulunamadı.");

        } else {
            // 2X Default
            if (!self.DefaultUpscalerJSModel) {
                console.log("Loading 2X Model Script...");
                importScripts('https://cdn.jsdelivr.net/npm/@upscalerjs/default-model@latest/dist/umd/index.min.js');
            }
            if (!self.DefaultUpscalerJSModel) throw new Error("2X Model Script yüklendi ama 'DefaultUpscalerJSModel' bulunamadı.");
            selectedModel = self.DefaultUpscalerJSModel;
        }

        upscaler = new Upscaler({
            model: selectedModel,
        });

        currentModelType = modelType;
        console.log(`AI Worker: Model Initialized (${modelType.toUpperCase()} - WebGL)`);

    } catch (err) {
        throw new Error(`Model Başlatma Hatası (${modelType}): ${err.message}`);
    }
};

self.onmessage = async (e) => {
    const { imageData, type, id, modelType } = e.data;

    try {
        if (type === 'MakeModelReady') {
            await initModel(modelType || '2x');
            self.postMessage({ type: 'ready', id });
            return;
        }

        if (type === 'Upscale') {
            const targetType = modelType || '2x';

            // 1. Init
            self.postMessage({ type: 'progress', message: `Model Yükleniyor (${targetType.toUpperCase()})...`, id });
            await initModel(targetType);

            // 2. Pre-process
            self.postMessage({ type: 'progress', message: 'Görüntü İşleniyor...', id });
            const pixels = tf.browser.fromPixels(imageData);
            const normalized = tf.tidy(() => pixels.cast('float32').div(255.0));
            pixels.dispose();

            // 3. Inference
            self.postMessage({ type: 'progress', message: `AI İyileştirme Uygulanıyor (${targetType.toUpperCase()})...`, id });

            // 4. Inference & Stitching (MANUAL TILING FOR BOTH 2X & 4X)
            // This ensures consistent low-memory usage and stability for all modes.

            let finalDataEncoded;
            let outW, outH;

            const scale = targetType === '4x' ? 4 : 2;
            const tileInputSize = 64; // Small tiles to keep RAM low
            const pad = 6; // Overlap

            const [h, w] = normalized.shape;
            outW = w * scale;
            outH = h * scale;

            // Allocate CPU buffer for result
            finalDataEncoded = new Uint8ClampedArray(outW * outH * 4);

            const numCols = Math.ceil(w / tileInputSize);
            const numRows = Math.ceil(h / tileInputSize);
            const totalTiles = numCols * numRows;
            let processedTiles = 0;

            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < numCols; c++) {
                    processedTiles++;
                    // Report progress
                    if (processedTiles % 5 === 0 || processedTiles === totalTiles) {
                        self.postMessage({ type: 'progress', message: `İşleniyor (%${Math.round((processedTiles / totalTiles) * 100)})`, id });
                        // Breath for GC and UI responsiveness
                        await new Promise(res => setTimeout(res, 5));
                    }

                    // Calculate Input Coordinates with Padding
                    const startX = c * tileInputSize;
                    const startY = r * tileInputSize;

                    // Input bounds including padding
                    const x1 = Math.max(0, startX - pad);
                    const y1 = Math.max(0, startY - pad);
                    const x2 = Math.min(w, startX + tileInputSize + pad);
                    const y2 = Math.min(h, startY + tileInputSize + pad);

                    const tileW = x2 - x1;
                    const tileH = y2 - y1;

                    // Slice Input Logic
                    const tileTensor = tf.tidy(() => {
                        return normalized.slice([y1, x1, 0], [tileH, tileW, 3]);
                    });

                    // Upscale Tile
                    const upscaledTile = await upscaler.upscale(tileTensor, {
                        output: 'tensor',
                        patchSize: undefined, // Already manually tiled
                        padding: 0
                    });

                    // Convert to pixels immediately
                    const tilePixels = await tf.browser.toPixels(upscaledTile);

                    // Dispose Tensors
                    tileTensor.dispose();
                    upscaledTile.dispose();

                    // --- CPU Stitching Logic ---
                    // Determine valid output region (removing padding)
                    // Input-space offsets relative to the tile we extracted
                    const validInX = (startX - x1);
                    const validInY = (startY - y1);
                    const validInW = Math.min(tileInputSize, w - startX);
                    const validInH = Math.min(tileInputSize, h - startY);

                    // Scale to Output-space
                    const validOutX = validInX * scale;
                    const validOutY = validInY * scale;
                    const validOutW = validInW * scale;
                    const validOutH = validInH * scale;

                    const upscaledTileW = tileW * scale;

                    // Copy row by row from tilePixels to finalDataEncoded
                    const targetStartX = startX * scale;
                    const targetStartY = startY * scale;

                    for (let row = 0; row < validOutH; row++) {
                        const srcRow = validOutY + row;
                        const srcColStart = validOutX;

                        const srcIndex = (srcRow * upscaledTileW + srcColStart) * 4;
                        const destRow = targetStartY + row;
                        const destColStart = targetStartX;
                        const destIndex = (destRow * outW + destColStart) * 4;

                        // Copy line
                        const lineBytes = validOutW * 4;
                        finalDataEncoded.set(
                            tilePixels.subarray(srcIndex, srcIndex + lineBytes),
                            destIndex
                        );
                    }
                }
            }

            normalized.dispose();

            // 4. Send Result
            self.postMessage({ type: 'progress', message: 'Sonuç Oluşturuluyor...', id });

            const msgData = {
                width: outW,
                height: outH,
                data: finalDataEncoded
            };

            // Transfer buffer for performance
            try {
                self.postMessage({ type: 'complete', result: msgData, id }, [finalDataEncoded.buffer]);
            } catch (transferErr) {
                self.postMessage({ type: 'complete', result: msgData, id });
            }
        }
    } catch (error) {
        console.error("Worker Critical Error:", error);
        self.postMessage({ type: 'error', error: error.message || "Bilinmeyen Hata", id });
    }
};
