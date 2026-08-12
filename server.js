**İstenen bilgiler**

| Ölçüt | Hesaplama | Sonuç |
|-------|-----------|-------|
| **Toplam istek hızı** | 10 000 kullanıcı × 2 istek/saniye | **20 000 istek/saniye** |
| **Bir isteğin işlenme süresi** | 350 ms = 0.35 s | – |
| **Bir işlem biriminin (ör. bir thread) saniyede işleyebileceği istek sayısı** | 1 s ÷ 0.35 s ≈ **2.86 istek/s** | – |
| **Gereken eşzamanlı işlem (thread) sayısı** | 20 000 istek/s ÷ 2.86 istek/s ≈ **7 000 thread** | – |
| **Tek bir sunucunun teorik maksimum işleyebileceği istek sayısı** (yeterli eşzamanlılık varsayımı) | 7 000 thread × 2.86 istek/s ≈ **20 000 istek/s** | – |
| **Tek bir tek çekirdek (veya tek bir thread) ile maksimum işleme kapasitesi** | 1 ÷ 0.35 s ≈ **2.86 istek/s** | – |

### Açıklama

1. **İstek hızı**: Her kullanıcı saniyede 2 istek gönderiyor, 10 000 kullanıcı olduğundan toplam **20 000 istek/saniye** oluşur.  
2. **İşlem süresi**: Bir isteğin ortalama işlenme süresi **350 ms (0.35 s)**. Bu, bir işlem biriminin (ör. bir thread) bir saniyede yaklaşık **2.86** istek işleyebileceği anlamına gelir.  
3. **Eşzamanlı işlem kapasitesi**: Gelen yükü karşılamak için gereken paralel işleyiş sayısı, toplam istek hızını bir birimin kapasitesine bölerek bulunur:  
   \[
   \frac{20\,000\ \text{istek/s}}{2.86\ \text{istek/s per thread}} \approx 7\,000\ \text{thread}
   \]  
   Yani **yaklaşık 7 000 eşzamanlı işlem (thread/worker)** gerekir.  
4. **Tek sunucu teorik kapasitesi**: Sunucu bu kadar eşzamanlı iş parçacığını (veya async/await gibi non‑blocking bir modelle) destekleyebiliyorsa, teorik olarak **20 000 istek/saniye** işleyebilir. Ancak tek bir çekirdek ya da tek bir thread yalnızca **≈2.86 istek/s** kapasiteye sahiptir; bu da tek çekirdekli bir yapı için yetersiz olur.

**Pratik öneri:**  
- **Thread‑pool** ya da **asenkron I/O** (Node.js, async/await, non‑blocking I/O) kullanarak 7 000 civarında eşzamanlı iş parçacığı/işlem oluşturmak.  
- Yük dengeleme (load balancer) ve **çoklu CPU çekirdeği** (ör. 8‑16 çekirdekli bir makine) ile bu thread sayısını çekirdekler arasında dağıtmak.  
- **İş kuyruğu** (queue) ve **rate‑limiting** ekleyerek ani trafik dalgalanmalarını kontrol altında tutmak.  

Bu sayılar teoriktir; gerçek dünyada ağ gecikmesi, veritabanı erişimi, GC pause’ları vb. ek gecikmelerle birlikte biraz daha yüksek eşzamanlılık gerekebilir.
