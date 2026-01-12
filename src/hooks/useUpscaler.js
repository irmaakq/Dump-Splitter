import { useState, useRef, useCallback } from 'react';

/**
 * @typedef {'2x' | '4x'} UpscaleType
 * @typedef {'idle' | 'loading' | 'processing' | 'complete' | 'error'} UpscaleStatus
 * 
 * @typedef {Object} UpscaleResult
 * @property {UpscaleStatus} status
 * @property {number} progress - 0 to 100
 * @property {string | null} message - Current status message
 * @property {string | null} resultImage - Base64 or Blob URL of upscaled image
 * @property {Error | null} error
 * @property {Function} upscaleImage - (file: File | Blob, type: UpscaleType) => Promise<string>
 * @property {Function} cancel - Terminates the worker
 */

/**
 * Hook for Client-Side 4X/2X Upscaling
 * Connects to aiWorker.js (in root/public)
 */
export function useUpscaler() {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);

    // Worker reference to persist across renders
    const workerRef = useRef(null);

    const cleanup = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
    }, []);

    const cancel = useCallback(() => {
        cleanup();
        setStatus('idle');
        setMessage('İşlem iptal edildi.');
        setProgress(0);
    }, [cleanup]);

    const upscaleImage = useCallback(async (file, type = '4x') => {
        // Reset State
        cleanup();
        setStatus('loading');
        setProgress(0);
        setError(null);
        setResultImage(null);
        setMessage(`${type.toUpperCase()} motoru başlatılıyor...`);

        return new Promise((resolve, reject) => {
            try {
                // Initialize Worker
                // './aiWorker.js' assumes the worker is in the same folder as index.html (public root)
                const worker = new Worker('./aiWorker.js');
                workerRef.current = worker;

                // 1. Prepare Image (File -> ImageBitmap/ImageData)
                const img = new Image();
                if (typeof file === 'string') {
                    img.src = file;
                } else {
                    img.src = URL.createObjectURL(file);
                }

                img.onload = () => {
                    // Create Canvas to extract pixels
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);

                    // Send to Worker
                    worker.postMessage({
                        type: 'Upscale',
                        modelType: type,
                        imageData: imageData,
                        id: Date.now().toString()
                    });

                    setStatus('processing');
                };

                img.onerror = () => {
                    const err = new Error("Fotoğraf yüklenemedi.");
                    setError(err);
                    reject(err);
                };

                // Handle Worker Messages
                worker.onmessage = (e) => {
                    const { type, message: msg, result, error: workerErr, progress: progVal } = e.data;

                    if (type === 'progress') {
                        if (msg) setMessage(msg);
                        if (progVal !== undefined) setProgress(progVal);
                    }
                    else if (type === 'complete') {
                        // Success!
                        const { width, height, data } = result;

                        // Reconstruct Image from raw pixels
                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = width;
                        finalCanvas.height = height;
                        const finalCtx = finalCanvas.getContext('2d');
                        const finalImageData = new ImageData(new Uint8ClampedArray(data), width, height);
                        finalCtx.putImageData(finalImageData, 0, 0);

                        // Export to Blob/URL
                        finalCanvas.toBlob((blob) => {
                            const url = URL.createObjectURL(blob);
                            setResultImage(url);
                            setStatus('complete');
                            setMessage('İşlem Tamamlandı!');
                            cleanup(); // Terminate worker to free RAM
                            resolve(url);
                        }, 'image/png');
                    }
                    else if (type === 'error') {
                        const err = new Error(workerErr || "Bilinmeyen Worker Hatası");
                        setError(err);
                        setStatus('error');
                        cleanup();
                        reject(err);
                    }
                };

                worker.onerror = (e) => {
                    const err = new Error("Worker başlatılamadı veya çöktü. (aiWorker.js bulunamadı?)");
                    setError(err);
                    setStatus('error');
                    cleanup();
                    reject(err);
                };

            } catch (err) {
                cleanup();
                setError(err);
                setStatus('error');
                reject(err);
            }
        });
    }, [cleanup]);

    return {
        upscaleImage,
        cancel,
        status,
        progress,
        message,
        resultImage,
        error
    };
}
