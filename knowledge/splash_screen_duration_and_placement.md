# Knowledge: Penyesuaian Durasi & Penempatan Global Splash Screen

## 1. Analisis Permasalahan (Critical Issue Analysis)
Pengguna meminta Splash Screen ditampilkan lebih lama di awal sebelum pengguna masuk/login ("Splash screen dibikin agak lama di awal sblm login").

### Temuan Kode saat Ini:
1. **Durasi Terlalu Singkat**: Di [SplashScreen.tsx](file:///home/vereniaes/project/abi-homestay-app/components/SplashScreen.tsx#L20), durasi kemunculan hanya `400ms` (0.4 detik), sehingga logo dan teks branding menghilang terlalu cepat hampir tidak terlihat.
2. **Lokasi Terbatas**: `SplashScreen` saat ini hanya dipasang di dalam [HomeDashboardClient.tsx](file:///home/vereniaes/project/abi-homestay-app/components/HomeDashboardClient.tsx#L30) (Halaman Beranda setelah login). Ketika pengguna pertama kali mengakses aplikasi dan diarahkan ke `/login`, Splash Screen tidak muncul.

---

## 2. 3 Opsi Solusi yang Dapat Diterapkan (3 Options with Reasoning)

### **Opsi 1: Durasi 2.0 Detik + Penempatan Global di `AppLayoutWrapper` (Rekomendasi Utama)**
- **Deskripsi**:
  - Mengubah durasi penayangan Splash Screen dari 0.4s menjadi **2.0 detik** (2000ms) dengan animasi *fade-out* 700ms yang halus.
  - Memindahkan `<SplashScreen />` ke [AppLayoutWrapper.tsx](file:///home/vereniaes/project/abi-homestay-app/components/AppLayoutWrapper.tsx) agar muncul saat web pertama kali diakses di halaman mana pun (termasuk `/login`).
  - Menjaga pengecekan `sessionStorage.getItem("splashShown")` agar Splash Screen hanya tampil 1 kali di awal sesi browser (tidak mengganggu navigasi antar-halaman setelahnya).
- **Kelebihan**: Memberikan kesan pertama yang sangat profesional, elegan, dan menjamin splash screen selalu muncul sebelum halaman login.

### **Opsi 2: Durasi 3.0 Detik dengan Animasi Progress Loading Bar**
- **Deskripsi**: Penayangan selama 3.0 detik dilengkapi animasi indikator garis pemuat (*loading progress bar*) di bawah teks branding Abi Homestay.
- **Kelebihan**: Memberikan aksen visual tambahan.
- **Kekurangan**: Durasi 3 detik dapat terasa sedikit lama bagi pengguna yang ingin segera login.

### **Opsi 3: Durasi 1.5 Detik Khusus pada Halaman `/login`**
- **Deskripsi**: Splash screen berdurasi 1.5 detik hanya dipasang khusus pada file `app/login/page.tsx`.

---

## 3. Analisis Dampak Terhadap Kode Lain (Impact Analysis)
- **Komponen Terdampak Langsung**:
  - [components/SplashScreen.tsx](file:///home/vereniaes/project/abi-homestay-app/components/SplashScreen.tsx) -> Perubahan timer dari 400ms menjadi 2000ms.
  - [components/AppLayoutWrapper.tsx](file:///home/vereniaes/project/abi-homestay-app/components/AppLayoutWrapper.tsx) -> Menambahkan `<SplashScreen />` sebagai wrapper global.
  - [components/HomeDashboardClient.tsx](file:///home/vereniaes/project/abi-homestay-app/components/HomeDashboardClient.tsx) -> Menghapus penempatan ganda `<SplashScreen />`.
- **Dampak pada Logika Backend / Auth**: 0% potensi error. Tidak memengaruhi cookie sesi, Prisma DB, maupun middleware.

---

## 4. Format Komentar Kode (Standard Guideline)
```ts
// helper --------------------------------------------------------------------------
// function SplashScreen overlay animasi awal masuk aplikasi (durasi 2 detik)
// input param : none
// output : React Component JSX atau null jika sudah selesai
// end of helper ------------------------------------------------------------------
```
