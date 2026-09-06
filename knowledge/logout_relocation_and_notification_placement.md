# Knowledge: Pemindahan Tombol Logout ke Pengaturan & Penempatan Lonceng Notifikasi di Header TopBar

## 1. Analisis Permasalahan & Kebutuhan (Critical Analysis)
Pengguna meminta dua penyesuaian tata letak navigasi:
1. **Pemindahan Tombol Logout**: Menghapus tombol Logout dari header navigasi utama dan memasangnya secara rapi di dalam halaman Pengaturan (`/pengaturan`).
2. **Penempatan Lonceng Notifikasi**: Memindahkan posisi tombol lonceng Notifikasi di TopBar/Header ke lokasi yang sebelumnya ditempati oleh tombol Logout (pojok paling kanan header).

---

## 2. 3 Opsi Solusi (3 Options with Reasoning)

### **Opsi 1: Clean Header Reorganization (Rekomendasi Utama)**
- **Deskripsi**:
  - **TopAppBar Mobile & SideNav Header**:
    - Menghapus ikon `logout` merah dari header navigasi global.
    - Menempatkan tombol lonceng `notifications` di posisi paling kanan header (menggantikan tombol logout yang lama).
  - **Halaman Pengaturan (`app/pengaturan/page.tsx`)**:
    - Memuat profil pengguna aktif (`getCurrentUser()`).
    - Menambahkan tombol merah **"Keluar dari Akun"** (`logoutUser()`) yang terlihat jelas di seksi "Sistem & Keamanan" serta seksi Profil.
- **Kelebihan**: Tampilan header aplikasi di semua halaman menjadi sangat bersih dan luas. Lonceng notifikasi terlihat menonjol di pojok kanan atas, sedangkan tombol logout berada di halaman Pengaturan sesuai standar aplikasi manajemen modern.

### **Opsi 2: Lonceng Notifikasi di Pojok Kanan TopBar & Tombol Logout di Bottom Card Pengaturan**
- **Deskripsi**: Menempatkan lonceng notifikasi di pojok kanan atas TopBar, dan menempatkan tombol logout di bagian paling bawah kartu akun pada halaman Pengaturan.

### **Opsi 3: Floating TopBar Notification Badge & Modal Logout pada Pengaturan**
- **Deskripsi**: Menempatkan lonceng di TopBar dan membuat konfirmasi dialog modal logout saat opsi keluar diklik pada Pengaturan.

---

## 3. Analisis Dampak Terhadap Kode Lain (Impact Analysis)
- **Komponen Terdampak Langsung**:
  - [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) -> Pemindahan posisi lonceng notifikasi ke pojok paling kanan & penghapusan tombol logout.
  - [app/pengaturan/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx) -> Penambahan fungsi `handleLogout` dan komponen tombol merah Logout.
- **Dampak pada Fitur Lain**: 0% potensi *breakage*. Seluruh logika autentikasi sesi (`abi_session`), cookie, dan notifikasi tetap berjalan dengan sempurna.

---

## 4. Format Komentar Kode (Standard Guideline)
```ts
// helper --------------------------------------------------------------------------
// function untuk memproses logout pengguna dari halaman Pengaturan
// input param : none
// output : void (menghapus cookie sesi dan mengarahkan ke /login)
// end of helper ------------------------------------------------------------------
```
