import { useState, useRef, useCallback, useEffect } from 'react';

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
 * Connects to aiWorker_v2.js (in root/public)
 * GÜNCELLEME: Worker v2 bağlantısı ve hata yönetimi iyileştirildi.
 */
export function useUpscaler() {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);

    // Worker reference to persist across renders
    const workerRef = useRef(null);

    // Temizlik Fonksiyonu (Bellek Sızıntısını Önler)
    const cleanup = useCallback(() => {
        if (workerRef.current) {
            console.log("Hook: Worker sonlandırılıyor...");
            workerRef.current.terminate();
            workerRef.current = null;
        }
    }, []);

    // Bileşen unmount olduğunda temizle
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

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
                // Initialize Worker (v2 for optimized performance)
                // Cache-busting (?v=timestamp) eklenerek tarayıcının eski sürümü tutması engellenir.
                const workerUrl = `/aiWorker_v2.js?v=${Date.now()}`;
                const worker = new Worker(workerUrl);
                workerRef.current = worker;

                // 1. Resmi Hazırla (File -> ImageBitmap/ImageData)
                const img = new Image();
                if (typeof file === 'string') {
                    img.src = file;
                    // Cross-origin sorunlarını önlemek için
                    img.crossOrigin = "anonymous";
                } else {
                    img.src = URL.createObjectURL(file);
                }

                img.onload = () => {
                    // Create Canvas to extract pixels
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        const e = new Error("Canvas context oluşturulamadı.");
                        setError(e);
                        reject(e);
                        return;
                    }

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
                    const err = new Error("Fotoğraf yüklenemedi veya bozuk.");
                    setError(err);
                    setStatus('error');
                    cleanup();
                    reject(err);
                };

                // Handle Worker Messages (Worker'dan gelen yanıtlar)
                worker.onmessage = (e) => {
                    const { type, message: msg, result, error: workerErr, progress: progVal } = e.data;

                    if (type === 'progress') {
                        if (msg) setMessage(msg);
                        if (progVal !== undefined) setProgress(progVal);
                    }
                    else if (type === 'complete') {
                        // Başarılı!
                        const { width, height, data } = result;

                        // Raw piksel verisinden tekrar resim oluştur
                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = width;
                        finalCanvas.height = height;
                        const finalCtx = finalCanvas.getContext('2d');
                        const finalImageData = new ImageData(new Uint8ClampedArray(data), width, height);
                        finalCtx.putImageData(finalImageData, 0, 0);

                        // Export to Blob/URL
                        finalCanvas.toBlob((blob) => {
                            if (!blob) {
                                const e = new Error("Blob oluşturulamadı.");
                                setError(e);
                                reject(e);
                                return;
                            }
                            const url = URL.createObjectURL(blob);
                            setResultImage(url);
                            setStatus('complete');
                            setMessage('İşlem Tamamlandı!');
                            cleanup(); // İş bitti, worker'ı kapat (RAM Tasarrufu)
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
                    console.error("Worker Hatası:", e);
                    const err = new Error("Arkaplan işlemi çöktü (Bellek yetersiz olabilir).");
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
