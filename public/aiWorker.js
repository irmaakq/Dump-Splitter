/* eslint-disable no-restricted-globals */

// CLIENT-SIDE 4X UPSCALING WORKER (Production Grade)
// Stack: TensorFlow.js + UpscalerJS + Tiled Inference Pipeline
// Güncelleme: PURE GPU MODU (CPU-GPU Senkronizasyonu kaldırıldı -> Crash Çözümü)

// 1. IMPORTS (En son ve en stabil sürümler)
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');
importScripts('https://unpkg.com/upscaler@latest/dist/browser/umd/upscaler.min.js');
importScripts('https://unpkg.com/@upscalerjs/default-model@latest/dist/umd/index.min.js');
// REAL-ESRGAN (GANS) MODÜLÜ - RAKİP SİTE KALİTESİ İÇİN
importScripts('https://unpkg.com/@upscalerjs/esrgan-legacy@latest/dist/umd/models/esrgan-legacy/src/umd.min.js');

// 2. CONFIGURATION (Ayarlar - "HAYATTA KALMA" + "YÜKSEK KALİTE" MODU)
const CONFIG = {
    TILE_SIZE: 64,       // Stabilite için küçük parçalar.
    PADDING: 32,         // Çizgileri yok etmek için.
    DELAY_MS: 500,       // Donmayı önlemek için.
    TENSOR_CLEANUP: true
};

// 3. STATE (Durum)
let upscaler4x = null;
let upscaler2x = null;
let isWarmedUp = false;

// --- INITIALIZATION & WARMUP (Başlatma ve Isınma) ---

const initModels = async (type) => {
    if (type !== '4x' && type !== '2x') throw new Error("Geçersiz model tipi.");

    await tf.setBackend('webgl');
    await tf.ready();

    if (type === '4x') {
        if (!upscaler4x) {
            console.log("Worker: 4X Model Yükleniyor (REAL-ESRGAN / GANS)...");

            // UMD Kütüphane ismini bulmak için geniş kapsamlı arama
            // Genellikle: UpscalerjsEsrganLegacy veya esrgan_legacy olarak çıkar.
            const esrganLib = self.UpscalerjsEsrganLegacy ||
                self.esrgan_legacy ||
                self.EsrganLegacy ||
                self['@upscalerjs/esrgan-legacy'];

            if (!esrganLib) {
                // HATA AYIKLAMA: Global değişkenleri konsola bas ki ismini görelim
                console.error("Mevcut Global Değişkenler:", Object.keys(self).filter(k => k.toLowerCase().includes('esrgan') || k.toLowerCase().includes('upscaler')));
                throw new Error("4X Kütüphanesi (Real-ESRGAN) bulunamadı. CDN hatası olabilir.");
            }

            const modelToUse = esrganLib.gans || esrganLib.default || esrganLib;

            upscaler4x = new Upscaler({
                model: modelToUse,
            });
            await warmup(upscaler4x);
        }
    } else {
        if (!upscaler2x) {
            console.log("Worker: 2X Model Yükleniyor (Default)...");
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
        const dummy = tf.zeros([1, 16, 16, 3]);
        await model.upscale(dummy);
        dummy.dispose();
        isWarmedUp = true;
    } catch (e) {
        console.warn("Worker: Isınma uyarısı:", e);
    }
};

// --- TILED INFERENCE PIPELINE (Parçalı İşleme Motoru) ---

const processTiled = async (imageData, modelType, id) => {
    const upscaler = modelType === '4x' ? upscaler4x : upscaler2x;
    const scale = modelType === '4x' ? 4 : 2;

    const fullTensor = tf.browser.fromPixels(imageData);
    const [h, w] = fullTensor.shape;

    const outW = w * scale;
    const outH = h * scale;

    let finalBuffer;
    try {
        finalBuffer = new Uint8ClampedArray(outW * outH * 4);
    } catch (e) {
        throw new Error(`Bellek Hatası: Çıktı resmi çok büyük (${outW}x${outH}).`);
    }

    const cols = Math.ceil(w / CONFIG.TILE_SIZE);
    const rows = Math.ceil(h / CONFIG.TILE_SIZE);
    const totalTiles = cols * rows;

    let processed = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            processed++;

            const srcX = c * CONFIG.TILE_SIZE;
            const srcY = r * CONFIG.TILE_SIZE;

            const x1 = Math.max(0, srcX - CONFIG.PADDING);
            const y1 = Math.max(0, srcY - CONFIG.PADDING);
            const x2 = Math.min(w, srcX + CONFIG.TILE_SIZE + CONFIG.PADDING);
            const y2 = Math.min(h, srcY + CONFIG.TILE_SIZE + CONFIG.PADDING);

            const tileW = x2 - x1;
            const tileH = y2 - y1;

            if (tileW <= 0 || tileH <= 0) continue;

            const tileTensor = tf.tidy(() => {
                return fullTensor
                    .slice([y1, x1, 0], [tileH, tileW, 3])
                    .div(255.0)
                    .clipByValue(0.0, 1.0);
            });

            let upscaledTensor;
            try {
                upscaledTensor = await upscaler.upscale(tileTensor, {
                    output: 'tensor',
                    patchSize: undefined,
                    padding: 0
                });
            } catch (err) {
                tileTensor.dispose();
                throw new Error(`Upscale Hatası: ${err.message}`);
            }

            // --- CRITICAL FIX: PURE GPU OPERATION ---
            // dataSync() kullanmak CPU-GPU senkronizasyonu yapar ve tarayıcıyı kilitler/çökertir.
            // Bunun yerine her şeyi GPU'da (tf.where) hallediyoruz.
            const tileBytes = await tf.tidy(() => {
                const meanVal = upscaledTensor.mean();
                // 1.0'dan büyükse High Range (0-255) kabul et
                const isHighRange = meanVal.greater(1.0);

                const safeTensor = tf.where(
                    isHighRange,
                    upscaledTensor.clipByValue(0, 255).toInt(), // High range ise int'e çevir
                    upscaledTensor.clipByValue(0.0, 1.0)            // Low range ise clip yap
                );

                return tf.browser.toPixels(safeTensor);
            });

            tileTensor.dispose();
            upscaledTensor.dispose();

            // Stitching Logic
            const validInX = (srcX - x1);
            const validInY = (srcY - y1);
            const validW = Math.min(CONFIG.TILE_SIZE, w - srcX);
            const validH = Math.min(CONFIG.TILE_SIZE, h - srcY);

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
                const line = tileBytes.subarray(srcIdx, srcIdx + (writeW * 4));
                finalBuffer.set(line, dstIdx);
            }
        }

        const percent = Math.round((processed / totalTiles) * 100);
        self.postMessage({
            type: 'progress',
            message: `İşleniyor: %${percent}`,
            progress: percent,
            id
        });

        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
    }

    fullTensor.dispose();

    if (CONFIG.TENSOR_CLEANUP) {
        tf.disposeVariables();
    }

    return {
        width: outW,
        height: outH,
        data: finalBuffer
    };
};

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
            await initModels(target); // Ensure loaded

            const start = performance.now();
            const result = await processTiled(imageData, target, id);
            const end = performance.now();

            console.log(`Worker: Bitti (${((end - start) / 1000).toFixed(2)}s)`);

            self.postMessage(
                { type: 'complete', result, id },
                [result.data.buffer]
            );
        }
    } catch (err) {
        console.error("Worker Hatası:", err);
        self.postMessage({ type: 'error', error: err.message, id });
    }
};
