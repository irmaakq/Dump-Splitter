# Dump Splitter

Instagram için deneysel fotoğraf bölme ve kalite artırma aracı

Dump Splitter, panoramik veya geniş fotoğrafları Instagram kaydırmalı gönderi (carousel) formatına uygun şekilde yüksek kaliteli parçalara ayırmak için geliştirilmiş web tabanlı bir araçtır.

---

## Nasıl kullanılır

1. Cihazınızdan yüksek çözünürlüklü bir fotoğraf veya video yükleyin.
2. Çıktı ayarlarını yapılandırın:
   - Parça sayısı (1–10 arası)
   - Çıktı formatı (PNG, JPG, WEBP)
   - Kalite modları (AI Enhance, Ultra HD)
3. Masaüstünde görseli sürükleyerek, mobilde iki parmakla yakınlaştırarak en uygun kadrajı ayarlayın.
4. Oluşturulan parçaları tek tek veya **Tümünü İndir** seçeneği ile indirin.

---

## Özellikler

- **Client-side çalışma**  
  Tüm işlemler tarayıcı üzerinde gerçekleşir. Dosyalar hiçbir sunucuya yüklenmez.

- **Otomatik bölme**  
  Görseller Instagram carousel yapısına uygun olacak şekilde eşit dikey parçalara ayrılır.

- **Yapay zekâ destekli iyileştirme**  
  Renk ve netlik otomatik olarak artırılır.

- **Mobil uyumluluk**  
  Dokunmatik cihazlar için optimize edilmiştir.

- **Ultra HD modu**  
  2× upscale ile kalite kaybı minimuma indirilir.

---

## Sık karşılaşılan durumlar

### Video yükleyebilir miyim?
Evet. Video dosyaları yüklenebilir.  
Ancak video parça parça kesilmez; videodan yüksek kaliteli bir kare alınarak fotoğraf gibi işlenir.

### Dosyalarım bir sunucuya gönderiliyor mu?
Hayır.  
Uygulama tamamen client-side çalışır. Yüklenen dosyalar yalnızca tarayıcınızın geçici belleğinde işlenir ve sayfa yenilendiğinde silinir.

### İndirme işlemi başlamıyor
**Tümünü İndir** butonuna bastığınızda indirme başlamıyorsa tarayıcınızın pop-up engelleyicisini kontrol edin.  
Alternatif olarak parçaları tek tek indirebilirsiniz.

---

## Geliştirme

Projeyi yerel ortamda çalıştırmak için:

### Depoyu klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/dump-splitter.git
cd dump-splitter

npm install
npm start

## Lisans

**Bu proje MIT Lisansı ile lisanslanmıştır.**
