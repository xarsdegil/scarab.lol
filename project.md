# PoE Scarab Regex Web App Dokümantasyonu

## 1. Projenin Amacı
Uygulamanın mevcut hedefi, Path of Exile evrenindeki scarab eşyalarının güncel piyasa fiyatlarını **`https://poe.ninja/poe1/api/economy/exchange/current/overview?league=Keepers&type=Scarab`** uç noktasından çekip oyunculara sezgisel bir fiyat kontrol paneli sunmaktır. Regex üretimi sonraki iterasyonda eklenecek; bu iterasyonda veri alma, filtreleme ve kullanıcıya fiyat görünürlüğü sağlama tamamlanmış olacak.

## 2. Hedef Kullanıcılar
- Scarab ticareti yapan, hangi scarabları almak/satmak istediğini güncel kura göre belirlemek isteyen oyuncular
- Loot filter ve ticaret makrolarında kullanmak üzere güvenilir fiyat listesi arayan ileri seviye kullanıcılar
- Gelecekte regex çıktısına ihtiyaç duyacak, ancak şu an doğru fiyat verisine odaklanan topluluk araç geliştiricileri

## 3. Faz Planı
### Faz 1 (bu doküman): API tabanlı scarab fiyat görüntüleyici
- Poe.ninja uç noktasına bağlan, Keepers ligindeki tüm scarabları listele.
- Varsayılan fiyat filtresi ve manuel seçimler ile kullanıcıya hangi scarabların ilgi çekici olduğu göster.
- Veri tutarlılığını doğrulamak için basit test ve hata yönetimi katmanları ekle.

### Faz 2 (sonraki sprint): Regex üreticisi
- Seçilmiş scarab isimlerine göre regex string’i üret.
- Clipboard entegrasyonu ve regex optimizasyonu bu faza taşınır.

## 4. Temel Özellikler (MVP)
### 4.1 Scarab Fiyatlarının Listelenmesi
- Poe.ninja API isteği `league` ve `type` parametreleriyle sabitlenir; ileride league dropdown’ı eklenebilir.
- Yanıt JSON’u `lines` alanında scarab nesneleri döner; her nesne `id`, `name`, `chaosValue`, `divineValue`, `sparkline` ve `detailsId` alanlarını barındırır.
- Frontend her satırda scarab adını (`detailsId` -> okunabilir form), `chaosValue`yu, işlem hacmini (`tradeVolume`), trend yüzdesini (`sparkline.totalChange`) ve küçük bir trend ikonunu gösterir.
- Tüm değerler 2 ondalık basamağa yuvarlanır; `chaosValue` boş ise satır gizlenir.

### 4.2 Varsayılan Fiyat Filtresi
- “Max Price (Chaos)” slider’ı 1 chaos’da başlar.
- Liste, slider değerinin altında kalan scarabları otomatik seçili gösterir; diğerleri gri renkli ancak görüntülenir.
- Slider değiştiğinde filtre ve seçim state’i eşzamanlı güncellenir.

### 4.3 Manuel Dahil/Hariç Bırakma
- Her satır checkbox barındırır; kullanıcı filtre sonucu ne olursa olsun satırı dahil/hariç bırakabilir.
- Manual seçimler local state’te saklanır; fiyat filtresi güncellendiğinde kullanıcı tercihleri korunur.
- Bu fazda checkbox hareketleri yalnızca görsel seçimi değiştirir; regex üretimi henüz yapılmayacağı için çıktı alanı placeholder kalır.

### 4.4 Gelecek Faz İçin Regex Placeholder
- Sağa hizalı panelde “Regex (Coming Soon)” başlığı ve seçili scarab sayısı gösterilir.
- Kullanıcılar bu panelde regex üretiminin sonra geleceğini açıkça görür.

## 5. UI / Akış Tasarımı
1. Uygulama açılır, Poe.ninja API çağrısı tetiklenir ve sonuç `react-query` (veya SWR) ile cache’lenir.
2. Loader sonrası tablo, 1 chaos altındaki scarabları otomatik seçili şekilde render eder.
3. Kullanıcı slider veya checkboxlarla seçimi değiştirir; sağ panelde seçili sayısı güncellenir.
4. Hata durumunda (örneğin API erişilemiyor) üst kısımda sarı uyarı banner’ı ve “Tekrar dene” butonu gösterilir.

## 6. Teknik Mimari
- **Frontend**: React + TypeScript + Vite. Veri alma için `fetch` + `react-query`, UI için TailwindCSS.
- **Veri modeli**: `ScarabPrice` tipi `id`, `name`, `chaosValue`, `divineValue`, `sparkline`, `tradeVolume` alanlarını içerir. `UserFilters` tipi `maxPriceChaos` ve `selectionMap`’i tutar.
- **Refresh stratejisi**: API isteği 5 dakikada bir otomatik yenilenir; manuel “Refresh” butonu mevcut.
- **Hata yönetimi**: 429 veya ağ hatalarında exponential backoff ile yeniden deneme; kullanıcıya durum mesajı.

## 7. API Detayları
- GET isteği örneği:
  ```http
  GET https://poe.ninja/poe1/api/economy/exchange/current/overview?league=Keepers&type=Scarab
  ```
- Yanıt yapısında kullanılan temel alanlar:
  ```json
  {
    "lines": [
      {
        "currencyTypeName": "Gilded Harbinger Scarab",
        "chaosValue": 42.1,
        "tradeVolume": 1832,
        "sparkline": { "totalChange": 12.4 }
      }
    ]
  }
  ```
- `currencyTypeName` kullanıcıya gösterilen isimdir; regex fazında bu değer kullanılacaktır.
- League veya type parametreleri gelecekte kullanıcı ayarına bağlanabilir; şu an sabit.

## 8. Test ve Doğrulama
- `fetchPrices` fonksiyonu için mocked API yanıtıyla birim testi; hatalı yanıt şeması yakalanmalı.
- Slider/checkbox etkileşimleri için React Testing Library senaryoları.
- Manuel seçim state’inin fiyat filtresi değiştiğinde korunmasını doğrulayan test.
- API hata durumunda banner gösterimi ve retry butonunun çağrıyı yeniden tetiklemesi için UI testi.

## 9. Gelecek Adımlar
- Regex üretimi, clipboard kopyalama ve regex optimizasyonu Faz 2’de geliştirilecek.
- Regex fazında mevcut seçim state’i doğrudan kullanılacağı için, bu fazda state yapısının kararlı ve testlerle güvence altına alınması kritik.

## 10. Özet
Bu sprintteki çıktı, Poe.ninja verisini temel alan, fiyat ve trend odaklı bir scarab panosudur. Kullanıcılar güvenilir veriyi hızlıca görüp seçimlerini belirleyebilecek, ileride eklenecek regex oluşturucu ise aynı seçim state’ini kullanarak eşleştirme ifadelerini üretecektir. Böylece proje parçalara ayrılarak daha kontrollü ve test edilebilir biçimde ilerler.
