# Knowledge: Konfigurasi CORS & CDN (Font Material Symbols & Static Assets)

## 1. Analisis Masalah Kritis & Kebutuhan
Pengguna meminta: "benerin cors sama cdnnya sekalian".

### Temuan Masalah Teknis:
1. **Kegagalan Muat Font Ikon (CORS & Ketiadaan CDN)**:
   - Di [app/layout.tsx](file:///home/vereniaes/project/abi-homestay-app/app/layout.tsx), tag `<link rel="preload" href="/fonts/material-symbols-outlined.woff2" crossOrigin="anonymous" />` meminta font lokal dengan mode CORS (`crossOrigin="anonymous"`).
   - Namun di [next.config.ts](file:///home/vereniaes/project/abi-homestay-app/next.config.ts), tidak ada deklarasi `headers()` yang menyediakan header `Access-Control-Allow-Origin: *`.
   - Di lingkungan cloud seperti Firebase App Hosting / Cloud Run, browser memblokir berkas font karena pelanggaran CORS dan ukuran berkas lokal yang mencapai 3.98 MB, sehingga seluruh ikon aplikasi bocor menjadi teks ligatur (`notifications`, `home`, `bed`, dll.).
2. **Ketiadaan Konfigurasi Cache-Control pada CDN**:
   - Berkas statis (`/fonts/*`, gambar, SVG) tidak memiliki header `Cache-Control` immutable/stale-while-revalidate, sehingga Firebase Hosting CDN tidak meng-cache aset secara optimal.
3. **Remote Patterns Gambar Vercel Blob**:
   - Unggahan struk dan bukti transfer di-host di `*.blob.vercel-storage.com`. Next.js memerlukan deklarasi `remotePatterns` untuk keamanan pemuatan gambar lintas domain.

---

## 2. 3 Opsi Solusi Desain Konfigurasi

### Opsi 1: Pemulihan Google Fonts CDN + CORS Headers Komprehensif di `next.config.ts` (Rekomendasi Utama)
- **Mekanisme**:
  1. [app/layout.tsx](file:///home/vereniaes/project/abi-homestay-app/app/layout.tsx): Mengaktifkan Google Fonts CDN resmi untuk Material Symbols Outlined dengan `preconnect` dan `display=swap`.
  2. [app/globals.css](file:///home/vereniaes/project/abi-homestay-app/app/globals.css): Menghapus `@font-face` lokal 4MB yang membebani jaringan, mempertahankan class `.material-symbols-outlined` dengan `font-feature-settings: 'liga'`.
  3. [next.config.ts](file:///home/vereniaes/project/abi-homestay-app/next.config.ts): Menambahkan blok `headers()` untuk menyertakan `Access-Control-Allow-Origin: *` pada `/fonts/:path*` dan aset statis, serta `images.remotePatterns` untuk domain Vercel Blob.
- **Kelebihan**: Ikon langsung normal 100% di semua halaman, ukuran transfer font turun dari 4 MB menjadi ~25 KB, dan aset statis aman dari pemblokiran CORS di Firebase App Hosting.

### Opsi 2: Local Font Only dengan CORS Headers di Next.js
- **Mekanisme**:
  - Hanya menambahkan konfigurasi headers CORS di `next.config.ts` dan tetap memaksa browser mengunduh berkas lokal 4 MB.
- **Kelemahan**: Transfer 4 MB tetap menjadi beban berat di perangkat mobile/koneksi lambat.

### Opsi 3: Global Middleware CORS Injection
- **Mekanisme**:
  - Menginjeksi header CORS melalui `middleware.ts` untuk setiap request aset.
- **Kelemahan**: Menambah beban eksekusi Edge Middleware untuk file statis yang seharusnya ditangani di level server config.
