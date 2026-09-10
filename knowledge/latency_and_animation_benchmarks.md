# Knowledge: Hasil Uji Benchmark Latensi Tiap Halaman & Analisis Delay Animasi

## 1. Hasil Pengukuran Latensi Tiap Halaman (Live Benchmark)

Pengujian dilakukan langsung terhadap database MongoDB Atlas terhubung dan Server Action.

| Halaman / Fitur | Latensi Database Query | Estimasi Roundtrip Server Action (Network) | Total Waktu Pemuatan Data | Status Saat Ini |
| :--- | :--- | :--- | :--- | :--- |
| **Beranda (`/`)** | 754.03 ms | Server-Side Render (SSR) | ~754 ms | Kueri 4 `count` + 2 `findMany` berjalan paralel |
| **Kamar (`/kamar`)** | 58.88 ms | ~150 ms | ~208 ms | 58 data kamar diambil sekaligus di `useEffect` |
| **Penghuni (`/penghuni`)** | 67.45 ms | ~150 ms | ~217 ms | Kueri tenant + include room dengan debounce 300ms |
| **Laporan (`/laporan`)** | 51.63 ms (tx) + 67.45 ms (tenant) | ~300 ms x 2 (Serial HTTP request) | **~600 - 700 ms** | **Bermasalah**: Dua Server Action dipanggil berurutan, counter berjalan sebelum fetch selesai dengan angka tiruan (24.500.000) |
| **Pengaturan (`/pengaturan`)** | 20.09 ms | ~150 ms | ~170 ms | Pricing & settings paralel |
| **Users (`/users`)** | 20.74 ms | ~150 ms | ~170 ms | Kueri user list |

---

## 2. Analisis Penyebab Masalah Animasi ("Animasi Masih Jelek" & Terlalu Lambat)

### A. Masalah Kritis di Halaman Laporan (`app/laporan/page.tsx`)
1. **Animasi Berjalan Sebelum Fetch**:
   - State awal `totalRevenue` adalah 0. Kode saat ini memiliki fallback tiruan:
     ```tsx
     <AnimatedCounter target={totalRevenue > 0 ? totalRevenue : 24500000} formatCurrency={true} />
     ```
   - Komponen langsung menganimasi angka tiruan Rp 24.500.000 pada saat pertama kali render (sebelum fetch selesai).
   - Ketika `fetchData()` selesai 600ms kemudian, angka tiba-tiba meloncat ke nilai asli dari database.
2. **Kueri Serial Tanpa Skeleton**:
   - `getTransactions()` dan `getTenants()` dipanggil berturut-turut tanpa `Promise.all`.
   - Tidak ada indikator skeleton pemuat (`isLoading`), sehingga konten kosong lalu menghentak (*flash content*).

### B. Durasi Animasi Terlalu Lambat & Jarak Translate Terlalu Lebar
1. **Durasi `slideUp`**:
   - `slideUp` diatur selama **0.6s (600 milidetik)** dengan pergeseran `translateY(24px)`.
   - Jarak 24px terlalu jauh dan 600ms terlalu lambat untuk antarmuka modern (standar micro-interaction native adalah 150ms - 200ms dengan jarak halus 8px - 10px).
2. **Stagger Delay Menahan Konten**:
   - `.stagger-4` hingga `.stagger-6` memiliki delay **200ms - 300ms** dan berstatus `opacity: 0`.
   - Akibatnya, sebagian elemen layar baru muncul setelah hampir 1 detik (300ms delay + 600ms durasi = 900ms).

### C. Responsivitas Tombol (*Tap Delay*)
1. **Button Press Effect**:
   - `.press-effect` menggunakan `transition: transform 0.2s` dengan `scale(0.95)`.
   - Penurunan skala 5% dengan durasi 200ms terasa "lembek" dan lambat kembali ke posisi semula.
2. **Action Transition**:
   - Tombol-tombol navigasi dan aksi menggunakan `transition-all duration-300`. Durasi 300ms membuat respons klik terasa tertunda (*laggy*).

---

## 3. Rencana Standarisasi Kecepatan Animasi (Native Snappy Target)

- **Page & Card Entrance**: Ubah durasi dari 600ms ke **200ms** (`0.2s`), jarak translate dari 24px ke **8px** (`translateY(8px)`).
- **Stagger Delay**: Pangkas dari 50ms-300ms menjadi **25ms-75ms** agar halaman terasa padat seketika.
- **Button Micro-Interaction**: Ubah `.press-effect` menjadi `transition: transform 0.1s ease-out` dengan `scale(0.98)` untuk respons klik instan tanpa delay.
- **Laporan Loading Flow**:
  1. Set `isLoading = true` saat awal buka halaman.
  2. Eksekusi `Promise.all([getTransactions(), getTenants()])` secara simultan.
  3. Tampilkan skeleton shimmer halus saat `isLoading = true`.
  4. Setelah data diterima, set `isLoading = false`, lalu picu `AnimatedCounter` hanya 1 kali dengan data riil dari database.
