/* eslint-disable no-restricted-globals */

// CLIENT-SIDE 4X UPSCALING WORKER (Production Grade)
// Stack: TensorFlow.js + UpscalerJS + Tiled Inference Pipeline
// Güncelleme: GPU Kilidini açmak için gecikme eklendi ve Grid Artifacts için Padding arttırıldı.

// 1. STABLE IMPORTS (Sabit Versiyonlar - Kararlılık İçin)
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
importScripts('https://unpkg.com/upscaler@0.13.3/dist/browser/umd/upscaler.min.js');
importScripts('https://unpkg.com/@upscalerjs/default-model@0.1.0/dist/umd/index.min.js');
importScripts('https://unpkg.com/@upscalerjs/esrgan-thick@0.1.0/dist/umd/models/esrgan-thick/src/umd.min.js');

// 2. CONFIGURATION (Ayarlar - ULTRA STABİLİTE)
const CONFIG = {
    TILE_SIZE: 128,      // 128px ideal denge.
    PADDING: 12,         // ÖNEMLİ: Padding 32 çok fazlaydı (RAM şişiriyordu). 12px (Input) -> 48px (Output) overlap yeterli.
    DELAY_MS: 100,       // GPU dinlendirme.
    TENSOR_CLEANUP: true
};

// 3. STATE (Durum)
let upscaler4x = null;
let upscaler2x = null;
let isWarmedUp = false;

// --- INITIALIZATION & WARMUP (Başlatma ve Isınma) ---

const initModels = async (type) => {
    // Geçerli tip kontrolü
    if (type !== '4x' && type !== '2x') throw new Error("Geçersiz model tipi.");

    await tf.setBackend('webgl');
    await tf.ready();

    if (type === '4x') {
        if (!upscaler4x) {
            console.log("Worker: 4X Model Yükleniyor (ESRGAN)...");
            const esrganLib = self.EsrganThick || self.ESRGANThick;
            if (!esrganLib) throw new Error("4X Kütüphanesi Yüklenemedi.");

            upscaler4x = new Upscaler({
                model: esrganLib.ESRGANThick4x || esrganLib,
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
        console.log("Worker: GPU shaderları ısınıyor...");
        // Shaderları derlemek için boş bir 1x1 işlem yap
        const dummy = tf.zeros([1, 16, 16, 3]);
        await model.upscale(dummy);
        dummy.dispose();
        isWarmedUp = true;
        console.log("Worker: Isınma tamamlandı.");
    } catch (e) {
        console.warn("Worker: Isınma uyarısı:", e);
    }
};

// --- TILED INFERENCE PIPELINE (Parçalı İşleme Motoru) ---

const processTiled = async (imageData, modelType, id) => {
    const upscaler = modelType === '4x' ? upscaler4x : upscaler2x;
    const scale = modelType === '4x' ? 4 : 2;

    // Ham piksel verisinden Tensor oluştur
    const fullTensor = tf.browser.fromPixels(imageData);
    const [h, w] = fullTensor.shape;

    // Çıktı boyutları
    const outW = w * scale;
    const outH = h * scale;

    // Sonuç için bellek ayır (Arabellek yok, direkt hedef buffer)
    let finalBuffer;
    try {
        finalBuffer = new Uint8ClampedArray(outW * outH * 4);
    } catch (e) {
        throw new Error(`Bellek Hatası: Çıktı resmi çok büyük (${outW}x${outH}). Lütfen daha küçük bir resim ile deneyin.`);
    }

    // Grid (Izgara) Hesaplaması
    const cols = Math.ceil(w / CONFIG.TILE_SIZE);
    const rows = Math.ceil(h / CONFIG.TILE_SIZE);
    const totalTiles = cols * rows;

    let processed = 0;

    // --- ANA DÖNGÜ (MAIN TILING LOOP) ---
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            processed++;

            // 1. Giriş Sınırlarını Hesapla (Padding Dahil)
            const srcX = c * CONFIG.TILE_SIZE;
            const srcY = r * CONFIG.TILE_SIZE;

            // Padding eklenmiş koordinatlar (Görüntü dışına taşmayacak şekilde clamp edilir)
            const x1 = Math.max(0, srcX - CONFIG.PADDING);
            const y1 = Math.max(0, srcY - CONFIG.PADDING);
            const x2 = Math.min(w, srcX + CONFIG.TILE_SIZE + CONFIG.PADDING);
            const y2 = Math.min(h, srcY + CONFIG.TILE_SIZE + CONFIG.PADDING);

            const tileW = x2 - x1;
            const tileH = y2 - y1;

            if (tileW <= 0 || tileH <= 0) continue;

            // 2. Parça Tensorunu Çıkar (0-1 Aralığına Normalleştir)
            const tileTensor = tf.tidy(() => {
                return fullTensor
                    .slice([y1, x1, 0], [tileH, tileW, 3])
                    .div(255.0)
                    .clipByValue(0.0, 1.0); // Kesin 0-1 aralığı
            });

            // 3. Yapay Zeka İşlemi (Inference)
            let upscaledTensor;
            try {
                upscaledTensor = await upscaler.upscale(tileTensor, {
                    output: 'tensor',
                    patchSize: undefined, // Manuel olarak böldüğümüz için kütüphane bölmesin
                    padding: 0
                });
            } catch (err) {
                const min = tileTensor.min().dataSync()[0];
                const max = tileTensor.max().dataSync()[0];
                tileTensor.dispose(); // Hata durumunda da temizle
                throw new Error(`Upscale Hatası (Parça ${r},${c}): ${err.message}`);
            }

            // 4. Tensörü İndir ve Piksel Verisine Çevir (AUTO-RANGE FIX DAHİL)
            const tileBytes = await tf.tidy(() => {
                // SİYAH EKRAN SORUNU ÇÖZÜMÜ:
                // Max değerine bakmak yerine ortalamaya (Mean) bakıyoruz.
                // Tek bir pikselin sapması yüzünden tüm resmi karartmamak için en güvenlisi bu.

                const meanVal = upscaledTensor.mean().dataSync()[0];
                let safeTensor;

                // Eğer ortalama 1.0'dan büyükse bu kesinlikle 0-255 aralığındadır.
                if (meanVal > 1.0) {
                    safeTensor = upscaledTensor.clipByValue(0, 255).toInt();
                } else {
                    // Değilse 0-1 aralığındadır.
                    safeTensor = upscaledTensor.clipByValue(0.0, 1.0);
                }

                return tf.browser.toPixels(safeTensor);
            });

            // 5. Temizlik (Memory Leak Önlemi)
            tileTensor.dispose();
            upscaledTensor.dispose();

            // 6. Birleştirme (Stitching - Overlap & Crop)
            // Gelen veri paddingli ve büyük. Sadece ortadaki "temiz" kısmı alacağız.

            // Input uzayındaki geçerli (clean) başlangıç ofseti
            const validInX = (srcX - x1);
            const validInY = (srcY - y1);

            // Input uzayındaki geçerli genişlik/yükseklik
            const validW = Math.min(CONFIG.TILE_SIZE, w - srcX);
            const validH = Math.min(CONFIG.TILE_SIZE, h - srcY);

            // Output uzayına (scale ile çarpılmış) çevir
            const targetX = srcX * scale;
            const targetY = srcY * scale;

            const upscaledTileW = tileW * scale; // Upscaled ham genişlik

            // Kopyalanacak blok boyutları
            const writeW = validW * scale;
            const writeH = validH * scale;

            // Kaynaktan okunacak başlangıç ofsetleri
            const readOffX = validInX * scale;
            const readOffY = validInY * scale;

            // Satır satır kopyala (Hızlı Bellek Bloğu İşlemi)
            for (let row = 0; row < writeH; row++) {
                // Kaynakta satır başı: (Y ofseti + satır) * genişlik + X ofseti
                const srcIdx = ((readOffY + row) * upscaledTileW + readOffX) * 4;

                // Hedefte satır başı: (Y hedef + satır) * ana genişlik + X hedef
                const dstIdx = ((targetY + row) * outW + targetX) * 4;

                // ArrayBuffer kopyalama (En hızlı yöntem)
                const line = tileBytes.subarray(srcIdx, srcIdx + (writeW * 4));
                finalBuffer.set(line, dstIdx);
            }
        }

        // İlerlemeyi Bildir (Satır başına 1 kere - UI'ı yormamak için)
        const percent = Math.round((processed / totalTiles) * 100);
        self.postMessage({
            type: 'progress',
            message: `İşleniyor: %${percent}`,
            progress: percent,
            id
        });

        // 7. GPU VE CPU NEFES ALMA MOLASI (ANTI-FREEZE)
        // Buradaki 100ms gecikme, tarayıcının araya girip render yapmasına
        // ve YouTube videosunun akmasına izin verir.
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
    }

    fullTensor.dispose();

    // Çöp Toplayıcıya İpucu (Garbage Collection)
    if (CONFIG.TENSOR_CLEANUP) {
        tf.disposeVariables();
    }

    return {
        width: outW,
        height: outH,
        data: finalBuffer
    };
};

// --- WORKER MESSAGING (Mesajlaşma) ---

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

            console.log(`Worker: İşlem tamamlandı. Süre: ${((end - start) / 1000).toFixed(2)}s`);

            // Büyük veriyi kopyalamadan (Zero-copy) transfer et
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
