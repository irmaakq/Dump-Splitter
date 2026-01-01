# Dump Splitter Contribution Guide (WIP)

Dump Splitter projesine katkıda bulunmak istediğiniz için teşekkür ederiz.
Bu proje açık kaynaklıdır ve topluluk katkılarıyla gelişmektedir.

Katkıda bulunmadan önce bu belgeyi dikkatlice okuyunuz.
Bu, bakımcılar (maintainers) ve katkıda bulunanlar için süreci daha düzenli
ve anlaşılır hale getirir.

---

## Genel Bilgiler

- Her türlü katkı değerlidir (kod, hata bildirimi, öneri, dokümantasyon)
- Proje ile ilgisi olmayan içerikler kabul edilmez
- Mevcut **Issues** ve **Pull Requests** kontrol edilmeden yeni içerik açılması önerilmez

---

## Bir sorum var

Bir soru sormadan önce:

- GitHub **Issues** bölümünde arama yapın
- Mevcut bir konu varsa, sorunuzu o başlık altında belirtin
- Dokümantasyonu ve mevcut açıklamaları okuyun

Gereksiz veya tekrar eden sorular kapatılabilir.

---

## Hata bildirme

Bir hata bildirmeden önce:

- En güncel sürümü kullandığınızdan emin olun
- Sorunun daha önce bildirilip bildirilmediğini kontrol edin
- Yapılandırma veya kullanım hatası olmadığından emin olun

Yeni bir hata bildirirken:

- Sorunu açık ve net şekilde açıklayın
- Gerekirse ekran görüntüsü veya örnek ekleyin
- Hatanın nasıl tekrar üretilebildiğini belirtin

---

## Geliştirme önerme

Yeni özellik veya iyileştirme önermek için:

- Önerinin neyi çözdüğünü açıkça belirtin
- Projeye sağlayacağı faydayı açıklayın
- Benzer bir öneri olup olmadığını kontrol edin

Bakımcılar, proje kapsamına uymayan önerileri reddedebilir.

---

## Kod katkısı (Pull Request)

### Başlamadan önce

- Projeyi **Fork**'layın
- Fork’unuzu yerel makinenize **Clone** edin

```bash
git clone https://github.com/KULLANICI_ADINIZ/dump-splitter.git
cd dump-splitter
Branch oluşturma
Her değişiklik için ayrı bir branch açın:

bash
Kodu kopyala
git checkout -b feature/yeni-ozellik
Değişiklikler
Mevcut kod yapısını bozmayın

Gereksiz dosya veya format değişikliği yapmayın

Küçük ve anlamlı commit’ler atın

Commit mesajları
Kısa ve açıklayıcı olsun

Tercihen emir kipi kullanın
(Örn: Yeni özellik eklendi, Hata düzeltildi)

İlk satır 72 karakteri geçmemelidir

bash
Kodu kopyala
git commit -m "Yeni kırpma ayarı eklendi"
Push ve Pull Request
bash
Kodu kopyala
git push origin feature/yeni-ozellik
GitHub üzerinden Pull Request açın

Ne yaptığınızı net şekilde açıklayın

Gerekirse ekran görüntüsü ekleyin

Kurallar
Kod kalitesine ve proje yapısına sadık kalın

Proje ile ilgisi olmayan değişikliklerden kaçının

Otomatik veya anlamsız PR’lar reddedilir

Bakımcı kararları nihaidir

Son Not
Katkılarınız için teşekkür ederiz.
Dump Splitter, topluluk desteğiyle gelişmektedir.
