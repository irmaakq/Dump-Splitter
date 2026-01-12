/* eslint-disable no-restricted-globals */

// AI WORKER - Handles heavy TensorFlow.js / Upscaler.js operations
// This runs in a separate thread to prevent UI freezing.

// Import libraries from UNPKG (More stable for UMD builds)
importScripts('https://unpkg.com/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
importScripts('https://unpkg.com/@upscalerjs/default-model@latest/dist/umd/index.min.js');
importScripts('https://unpkg.com/@upscalerjs/esrgan-thick@latest/dist/umd/index.min.js'); // Fixed path
importScripts('https://unpkg.com/upscaler@latest/dist/browser/umd/upscaler.min.js');

let upscaler = null;
let currentModelType = null; // '2x' or '4x'

const initModel = async (modelType = '2x') => {
    try {
        // If we already have the correct model loaded, do nothing
        if (upscaler && currentModelType === modelType) return;

        // If a different model is loaded, dispose it first (to free memory)
        if (upscaler) {
            try {
                // Garbage collect previous tensors
                await tf.disposeVariables();
            } catch (e) { console.warn("Cleanup warning:", e); }
            upscaler = null;
        }

        // Explicitly use WebGL for performance
        await tf.setBackend('webgl');
        await tf.ready();

        let selectedModel;
        if (modelType === '4x') {
            selectedModel = EsrganThick4x; // From imported script
        } else {
            selectedModel = DefaultUpscalerJSModel; // Default 2x model
        }

        upscaler = new Upscaler({
            model: selectedModel,
        });

        currentModelType = modelType;
        console.log(`AI Worker: Model Initialized (${modelType.toUpperCase()} - WebGL)`);
    } catch (err) {
        throw new Error(`Model Init Error: ${err.message}`);
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
            // Ensure correct model is loaded before starting
            const targetType = modelType || '2x';
            await initModel(targetType);

            // Notify start
            self.postMessage({ type: 'progress', message: `Yapay Zeka Motoru Hazırlanıyor (${targetType.toUpperCase()})...`, id });

            // Create tensor from ImageBitmap/ImageData
            const pixels = tf.browser.fromPixels(imageData);

            self.postMessage({ type: 'progress', message: 'Görüntü Analiz Ediliyor...', id });

            // Pre-process: Normalize to 0-1
            const normalized = tf.tidy(() => pixels.cast('float32').div(255.0));
            pixels.dispose();

            // Run Inference
            self.postMessage({ type: 'progress', message: `Süper Çözünürlük Uygulanıyor (${targetType.toUpperCase()})...`, id });

            // 4X models might need smaller patches to avoid blocks
            // 2X can handle larger patches
            const patchSize = targetType === '4x' ? 32 : 64;
            const padding = targetType === '4x' ? 2 : 2;

            const upscaledTensor = await upscaler.upscale(normalized, {
                patchSize,
                padding,
                output: 'tensor'
            });

            normalized.dispose();

            // Post-process: Clip & Convert back
            self.postMessage({ type: 'progress', message: 'Pikseller İşleniyor...', id });

            const clipped = tf.tidy(() => upscaledTensor.clipByValue(0, 1));
            const finalTensor = tf.tidy(() => clipped.mul(255.0).cast('int32'));
            upscaledTensor.dispose();
            clipped.dispose();

            const [height, width] = finalTensor.shape;
            const data = await tf.browser.toPixels(finalTensor);
            finalTensor.dispose();

            // Create output ImageData logic replacement (Transferrable)
            const msgData = {
                width,
                height,
                data // Uint8ClampedArray
            };

            // CRITICAL: Always try to transfer buffer to avoid memory spike
            try {
                self.postMessage({ type: 'complete', result: msgData, id }, [data.buffer]);
            } catch (transferErr) {
                // Fallback if transfer fails
                console.warn("Transferable failed, copying data...", transferErr);
                self.postMessage({ type: 'complete', result: msgData, id });
            }
        }
    } catch (error) {
        console.error("Worker Critical Error:", error);
        // Ensure main thread gets UNBLOCKED
        self.postMessage({ type: 'error', error: error.message || "Bilinmeyen Worker Hatası", id });
    }
};
