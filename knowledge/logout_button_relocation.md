# Knowledge: Pemindahan Tombol Logout ke Halaman Pengaturan

## 1. Analisis Permasalahan (Critical Issue Analysis)
Pengguna meminta tombol Logout/Keluar dipindahkan dari navigasi header global ke halaman Pengaturan saja ("Tombol log out pindahin ke halaman pengaturan aja").

### Temuan Kode saat Ini:
1. **Navigasi Global (`components/Navigation.tsx`)**:
   - Memiliki tombol logout di TopAppBar Mobile (`header`) dan di footer SideNav Desktop (`aside`).
2. **Halaman Pengaturan (`app/pengaturan/page.tsx`)**:
   - Memiliki seksi "Sistem & Keamanan" dan "Header Profil", namun belum menyertakan tombol aksi logout pengguna secara eksplisit.

---

## 2. 3 Opsi Solusi (3 Options with Reasoning)

### **Opsi 1: Pindahkan ke Seksi "Sistem & Keamanan" & Profil Header di Pengaturan (Rekomendasi Utama)**
- **Deskripsi**:
  - Menghapus ikon logout dari `Navigation.tsx` (baik TopAppBar Mobile maupun SideNav Desktop).
  - Pada `app/pengaturan/page.tsx`, tambahkan item tombol **"Keluar dari Akun"** berwarna merah yang elegan di seksi "Sistem & Keamanan", serta tombol logout cepat pada header profil.
  - Memanggil Server Action `logoutUser()` lalu mengarahkan pengguna kembali ke `/login`.
- **Kelebihan**: Tampilan navigasi utama menjadi lebih bersih, dan tombol logout mudah ditemukan di halaman Pengaturan.

### **Opsi 2: Tambahkan Seksi Khusus "Akun Saya" di Bagian Bawah Halaman Pengaturan**
- **Deskripsi**: Menempatkan kartu khusus "Akun Saya" di bagian paling bawah `app/pengaturan/page.tsx` yang memuat nama user, role badge, dan tombol Logout berwarna merah.
- **Kelebihan**: Rapi dan tidak memadatkan seksi operasional lainnya.

### **Opsi 3: Pindahkan Tombol Logout ke dalam Modal Popup "Keamanan Akun"**
- **Deskripsi**: Menempatkan tombol logout di dalam modal popup saat item "Keamanan Akun" diklik.
- **Kekurangan**: Membutuhkan 2x klik bagi pengguna untuk melakukan logout.

---

## 3. Analisis Dampak Terhadap Kode Lain (Impact Analysis)
- **Komponen Terdampak Langsung**:
  - [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) -> Menghapus tombol logout dari TopAppBar dan SideNav.
  - [app/pengaturan/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx) -> Mengimpor `logoutUser` dan `getCurrentUser` serta menambahkan UI tombol logout.
- **Dampak pada Fitur Lain**: 0% potensi *breakage*. Logika autentikasi dan cookie sesi `abi_session` tetap berfungsi dengan sempurna.

---

## 4. Format Komentar Kode (Standard Guideline)
```ts
// helper --------------------------------------------------------------------------
// function untuk memproses logout pengguna dari halaman Pengaturan
// input param : none
// output : void (menghapus cookie dan mengarahkan ke /login)
// end of helper ------------------------------------------------------------------
```
