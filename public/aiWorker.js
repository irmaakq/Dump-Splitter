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

            // 4X models benefit from smaller patches
            const patchSize = targetType === '4x' ? 32 : 64;
            const padding = targetType === '4x' ? 2 : 2;

            const upscaledTensor = await upscaler.upscale(normalized, {
                patchSize,
                padding,
                output: 'tensor'
            });

            normalized.dispose();

            // 4. Post-process
            self.postMessage({ type: 'progress', message: 'Sonuç Oluşturuluyor...', id });

            const clipped = tf.tidy(() => upscaledTensor.clipByValue(0, 1));
            const finalTensor = tf.tidy(() => clipped.mul(255.0).cast('int32'));
            upscaledTensor.dispose();
            clipped.dispose();

            const [height, width] = finalTensor.shape;
            const data = await tf.browser.toPixels(finalTensor);
            finalTensor.dispose();

            const msgData = {
                width,
                height,
                data
            };

            // Transfer buffer for performance
            try {
                self.postMessage({ type: 'complete', result: msgData, id }, [data.buffer]);
            } catch (transferErr) {
                self.postMessage({ type: 'complete', result: msgData, id });
            }
        }
    } catch (error) {
        console.error("Worker Critical Error:", error);
        self.postMessage({ type: 'error', error: error.message || "Bilinmeyen Hata", id });
    }
};
