# Knowledge: Analisis Optimasi Performa, Latensi, & Perangkat Rendah (HP Kentang)

## 1. Identifikasi Masalah Kritis (Critical Bottlenecks)

### A. GPU Paint Thrashing & Potensi Crash OOM (Out-of-Memory)
- **CSS `backdrop-filter: blur(...)`**:
  Komponen navigasi (`TopAppBar`, `BottomNavBar`), backdrop modal (`ImportExportModal`, detail kamar, dll.), serta background decorative blur di halaman login (`blur-3xl`) memicu pembuatan buffer off-screen GPU yang sangat berat di browser mobile dan Android WebView (Capacitor).
- **Infinite Animation Loop**:
  Animasi tanpa batas seperti `animate-pulse-slow` (3s infinite) dan `animate-bounce-gentle` (2s infinite) mencegah GPU/CPU masuk ke status hemat daya (idle sleep), memicu peningkatan temperatur perangkat dan CPU throttling.

### B. JavaScript Main-Thread Blocking
- **Re-rendering Berulang di `AnimatedCounter.tsx`**:
  Eksekusi `requestAnimationFrame` yang memicu pembaruan state React (`setCount`) setiap frame (60 kali per detik) selama 1.2 detik pada 4 kartu dashboard secara bersamaan. Di prosesor lambat, hal ini memicu antrean reconciler React dan memperlambat waktu respon interaksi (FID / INP).
- **Bundle Size Monolitik `xlsx` (SheetJS)**:
  `ImportExportModal.tsx` mengimpor `xlsx` secara statis di dalam [app/penghuni/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx). Hal ini membebani ukuran bundle awal halaman penghuni sebesar ratusan kilobyte meskipun modal tidak sedang dibuka.

### C. Latensi Jaringan & Database Roundtrip
- **Kueri Serial di `getDashboardStats()`**:
  Pengambilan statistik di [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts) menjalankan kueri `prisma.room.count()` dan `findMany` secara sekuensial (6 roundtrip berurutan ke MongoDB), melipatgandakan latensi jaringan.
- **Pencarian Tanpa Debounce**:
  Pengetikan di kolom pencarian penghuni memicu kueri Server Action ke database pada setiap ketukan huruf tanpa jeda penahanan waktu (debounce).
- **Render-Blocking External Font**:
  Font `Plus Jakarta Sans` dan `Material Symbols` di [app/layout.tsx](file:///home/vereniaes/project/abi-homestay-app/app/layout.tsx) dimuat melalui tag `<link>` eksternal, menambah roundtrip koneksi TLS dan menunda First Contentful Paint (FCP).

---

## 2. Analisis Penggunaan Library Animasi (Framer Motion vs Native CSS)

Pengguna menanyakan kemungkinan penggunaan pustaka animasi seperti *Framer Motion* yang ramah sumber daya. Berdasarkan analisis teknis dan pengujian ekosistem:

1. **Framer Motion Tidak Direkomendasikan untuk HP Kentang**:
   - Framer Motion menambah ukuran bundle JavaScript sebesar ~30-45 kB (gzipped).
   - Eksekusi animasi berjalan di atas JavaScript thread (React loop). Pada perangkat berprosesor rendah di dalam Android WebView, kalkulasi fisika JS memperlambat render dan dapat memicu crash saat memori habis.
2. **Solusi Optimal: Pure Hardware-Accelerated CSS (Transform & Opacity)**:
   - Berjalan langsung pada **Compositor Thread** browser di luar Main JavaScript Thread.
   - Ukuran penambahan JavaScript adalah 0 kB.
   - Mendukung fallback otomatis `@media (prefers-reduced-motion: reduce)` untuk perangkat yang mengaktifkan mode hemat daya.
3. **Alternatif Library Ringan Jika Diperlukan Fitur Interaktif Dinamis**:
   - Jika diperlukan pustaka khusus di masa mendatang, **Motion One** (`motion`) berbasis Web Animations API (WAAPI) dengan ukuran hanya ~2.8 kB jauh lebih cocok dibandingkan Framer Motion penuh.

---

## 3. Tiga Pilihan Solusi Performa

### Opsi 1: Maximum Performance & Zero Extra Bundle (Sangat Direkomendasikan)
- **Animasi**: Menghapus `backdrop-blur` berat pada container bergerak/scrolling dan menggantinya dengan warna solid semi-transparan (`bg-surface/98`). Menghilangkan loop animasi tak terbatas (`animate-pulse-slow`). Menggunakan transisi CSS native murni berbasis `transform` dan `opacity`.
- **Bundle & Memory**: Dynamic import (`next/dynamic`) untuk `ImportExportModal` agar SheetJS (`xlsx`) hanya dimuat saat tombol diklik.
- **Counter**: Optimasi `AnimatedCounter` dengan pembaruan langsung ke DOM `ref.textContent` atau durasi yang sangat singkat (400ms) tanpa state thrashing.
- **Latensi**: Menjalankan kueri database dashboard secara paralel dengan `Promise.all`. Menerapkan debounce 300ms pada pencarian penghuni.
- **Font**: Migrasi ke `next/font/google` bawaan Next.js untuk zero render-blocking network call.

### Opsi 2: Balanced Hybrid (CSS Ringan + Library Motion One)
- Mengadopsi library `@motionone/dom` (~2.8 kB) untuk animasi masuk dan popover, serta tetap mematikan `backdrop-blur` pada elemen fixed header/navbar.
- Memerlukan instalasi dependency baru (`motion`), namun tetap jauh lebih ringan dari Framer Motion.

### Opsi 3: Minimal Touch (Hanya Patch CSS & Database Tanpa Sentuh Komponen Lain)
- Hanya mengganti `backdrop-filter` dan merapikan kueri serial `Promise.all` di server actions.
- Komponen seperti SheetJS dan counter tetap apa adanya.
