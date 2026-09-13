# Knowledge: Diagnostik Vercel Blob Private Store & Kompresi Foto Struk

## 1. Temuan Kritis Akar Masalah Upload Bukti Transaksi
Berdasarkan uji coba langsung terhadap token `BLOB_READ_WRITE_TOKEN`:
1. **Store Terkonfigurasi sebagai Private Store**:
   - Galat saat eksekusi: `Vercel Blob: Cannot use public access on a private store. The store is configured with private access.`
   - Di kode [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts), fungsi `put()` memanggil `access: "public"`, sehingga seluruh unggahan bukti transfer di Vercel/Firebase otomatis ditolak oleh API Vercel Blob.
2. **Fallback Lokal Gagal di Serverless**:
   - Upaya fallback ke direktori `public/uploads/receipts` gagal di lingkungan serverless (Vercel / Firebase Cloud Run) karena filesystem bersifat *read-only*.
3. **Pemuatan Berkas Privat di Browser**:
   - Berkas di private store Vercel mengembalikan status HTTP `403 Forbidden` jika diakses langsung melalui URL publik browser.
   - Pemuatan harus menggunakan method `get(url, { access: "private", token })` yang di-stream melalui Next.js API Route Handler (misal `/api/receipts`).
4. **Batasan Ukuran Berkas 1MB Tanpa Kompresi Klien**:
   - Kamera ponsel menghasilkan berkas 2MB–10MB, yang memicu penolakan validasi form di `app/laporan/page.tsx` sebelum dikirim.

---

## 2. 3 Opsi Solusi

### Opsi 1: Adaptasi Private Store via Secure Proxy Route Handler + Auto Client-Side Canvas Compression (Rekomendasi Utama)
- **Mekanisme**:
  1. Ubah `put()` pada [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts) menggunakan `access: "private"`.
  2. Buat endpoint proxy aman [app/api/receipts/route.ts](file:///home/vereniaes/project/abi-homestay-app/app/api/receipts/route.ts) yang men-stream gambar private blob menggunakan `get()` dengan header caching.
  3. Tambahkan helper kompresi canvas sisi klien di `lib/image-compression.ts` yang otomatis mengompresi foto struk sebelum diunggah (< 800KB).
- **Kelebihan**: Langsung berjalan 100% dengan token Vercel Blob yang ada saat ini tanpa perlu membuat ulang Blob Store di dashboard Vercel.

### Opsi 2: Buat Ulang Vercel Blob Store Baru dengan Mode Public di Vercel Dashboard
- **Mekanisme**:
  Pengguna login ke dashboard Vercel -> Storage -> Create New Blob Store -> Pilih "Public Access" -> Salin token baru ke `.env` dan environment variables.
- **Kelemahan**: Memerlukan tindakan manual pengguna di luar kode, dan token lama harus diganti di semua environment.

### Opsi 3: Simpan Bukti Transaksi sebagai Base64 Langsung di MongoDB
- **Mekanisme**:
  Kompres gambar ke WebP resolusi rendah (~100KB) dan simpan string data URL langsung di dokumen MongoDB `Transaction.proofUrl`.
- **Kelemahan**: Menambah beban ukuran database MongoDB Atlas (BSON limit 16MB per dokumen).
