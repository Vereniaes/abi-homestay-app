# Knowledge: Masalah Rendering Ikon Material Symbols (Teks Ligatur Bocor)

## 1. Identifikasi Masalah
Pada halaman login dan tampilan lainnya di lingkungan produksi, ikon Material Symbols tampil sebagai teks biasa (misalnya: `apartment`, `person`, `lock`, `visibility`, `login`).

## 2. Penyebab Teknis (Root Cause)
1. **Mekanisme Kerja Ligatur**:
   Material Symbols menggunakan teknik CSS *font ligatures*. Teks HTML adalah kata biasa seperti `person`. Ketika font `Material Symbols Outlined` berhasil dimuat dan diterapkan oleh browser, mesin tipografi mengganti teks tersebut dengan bentuk glif ikon terkait.
2. **Kegagalan Pemuatan Font Lokal (4 MB WOFF2)**:
   - Pada commit `e0da3ec` dan `3a3d11e`, pemuatan dari Google Fonts CDN dihapus dan digantikan oleh berkas lokal `/fonts/material-symbols-outlined.woff2` berukuran sangat besar (~3.98 MB).
   - Di lingkungan cloud/serverless (seperti Firebase App Hosting / Cloud Run), request terhadap berkas font lokal berukuran besar ini dapat mengalami:
     - 404 Not Found jika direktori `public` belum terpetakan dengan benar pada container runtime.
     - Timeout atau pembatalan request jaringan akibat ukuran berkas 4 MB pada koneksi seluler.
     - Ketiadaan header MIME type `font/woff2` atau header CORS.
3. **Ketiadaan Fallback**:
   Ketika browser gagal mengunduh font lokal tersebut, browser secara otomatis menggunakan font sistem bawaan sehingga teks ligatur tampil apa adanya.

## 3. Opsi Solusi
1. **Google Fonts CDN (Standar Resmi)**: Menggunakan link CDN Google Fonts resmi dengan preconnect. Ukuran transfer berkas sangat kecil (~20-40 KB) karena di-subset secara dinamis oleh Google.
2. **Hybrid CDN + Local Fallback**: Menyediakan URL gstatic dengan fallback lokal.
3. **Perbaikan Static Header di Next.js**: Menambahkan konfigurasi headers pada `next.config.ts` untuk `font/woff2` dan memastikan file statis tersalin di environment build.
