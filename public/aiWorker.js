/* eslint-disable no-restricted-globals */

// AI WORKER - Handles heavy TensorFlow.js / Upscaler.js operations
// This runs in a separate thread to prevent UI freezing.

// Import libraries from UNPKG (More stable for UMD builds)
importScripts('https://unpkg.com/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
importScripts('https://unpkg.com/@upscalerjs/default-model@latest/dist/umd/index.min.js');
importScripts('https://unpkg.com/upscaler@latest/dist/browser/umd/upscaler.min.js');

let upscaler = null;

const initModel = async () => {
    if (upscaler) return;

    // Explicitly use WebGL for performance
    await tf.setBackend('webgl');
    await tf.ready();

    upscaler = new Upscaler({
        model: DefaultUpscalerJSModel,
    });

    console.log("AI Worker: Model Initialized (WebGL)");
};

self.onmessage = async (e) => {
    const { imageData, type, id } = e.data;

    try {
        if (type === 'MakeModelReady') {
            await initModel();
            self.postMessage({ type: 'ready', id });
            return;
        }

        if (type === 'Upscale') {
            if (!upscaler) await initModel();

            // Notify start
            self.postMessage({ type: 'progress', message: 'Yapay Zeka Motoru Başlatılıyor...', id });

            // Create tensor from ImageBitmap/ImageData
            // NOTE: fromPixels accepts ImageData, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageBitmap
            const pixels = tf.browser.fromPixels(imageData);

            self.postMessage({ type: 'progress', message: 'Görüntü Analiz Ediliyor...', id });

            // Pre-process: Normalize to 0-1
            const normalized = tf.tidy(() => pixels.cast('float32').div(255.0));
            pixels.dispose();

            // Run Inference (2x Upscale)
            self.postMessage({ type: 'progress', message: 'Süper Çözünürlük Uygulanıyor...', id });

            const upscaledTensor = await upscaler.upscale(normalized, {
                patchSize: 64,
                padding: 2,
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

            // Create output ImageData
            // We transfer the buffer to main thread for zero-copy if possible, or just send array
            const msgData = {
                width,
                height,
                data // Uint8ClampedArray
            };

            self.postMessage({ type: 'complete', result: msgData, id }, [data.buffer]);
        }

    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ type: 'error', error: error.message, id });
    }
};
