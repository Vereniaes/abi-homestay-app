# Knowledge: Analisis dan Opsi Deployment ABI Homestay App ke Firebase

## 1. Temuan Kritis & Evaluasi Arsitektur Proyek
Aplikasi ABI Homestay saat ini dibangun dengan arsitektur:
- **Framework**: Next.js 16.3.2 (React 19) dengan App Router.
- **Backend & Data Fetching**: Server Actions (`app/actions.ts`, mutasi kamar, penghuni, transaksi, autentikasi sesi via cookie) dan Middleware (`middleware.ts`).
- **Database**: Prisma Client v6.19.3 terhubung langsung ke MongoDB Atlas (`MONGODB_URI`).
- **Storage**: `@vercel/blob` untuk upload bukti transfer dan foto identitas.

### Masalah Kritis Jika Menggunakan Firebase Hosting Biasa (Static)
1. **Firebase Hosting Tradisional Hanya Mendukung Static Hosting**:
   - Jika proyek diubah menjadi static export (`output: 'export'`), seluruh Server Actions, dynamic SSR, autentikasi session cookie di `middleware.ts`, dan kueri langsung Prisma ke MongoDB tidak akan berfungsi.
2. **Kebutuhan Server Runtime (SSR / Node.js Engine)**:
   - Server Actions dan Prisma MongoDB membutuhkan runtime Node.js aktif untuk menangani koneksi database dan enkripsi token autentikasi.
3. **Prisma Engine Binary di Lingkungan Serverless**:
   - Pada Firebase App Hosting atau Cloud Functions, binary engine Prisma harus digenerate saat build (`prisma generate`) dan file binary engine Linux harus terbawa ke dalam container output.
4. **Kebutuhan Firebase Blaze Plan**:
   - Firebase App Hosting (yang berbasis Cloud Run) maupun Firebase Hosting SSR (Cloud Functions) memerlukan akun Firebase dengan paket **Blaze (Pay-as-you-go / kartu kredit)**; tidak dapat berjalan di paket gratis Spark.

---

## 2. Peta Solusi Deployment

### Opsi 1: Firebase App Hosting (Resmi Google Cloud / Firebase untuk Fullstack Next.js)
- **Mekanisme**: Firebase mendeteksi Next.js secara otomatis, membuat build container di Cloud Build, dan mengeksekusinya di Google Cloud Run.
- **Persyaratan**:
  - Akun Firebase Blaze Plan (Pay-as-you-go).
  - Hubungkan repositori Git (GitHub) ke Firebase App Hosting via Firebase Console.
  - Skrip build di `package.json` harus menjalankan `prisma generate && next build`.
  - Konfigurasi Secret/Environment Variables (`MONGODB_URI`, `ADMIN_PASSWORD`, dll.) di Google Cloud Secret Manager / Firebase Console.

### Opsi 2: Docker Container di Google Cloud Run (Self-Packaged Firebase Ecosystem)
- **Mekanisme**: Membuat `Dockerfile` multi-stage Next.js standalone output (`output: 'standalone'`).
- **Keunggulan**: Kontrol penuh atas Node.js runtime, binary Prisma, memory limit, dan cold-start. Firebase Hosting dapat diarahkan (rewrite) ke Cloud Run service ini.
- **Persyaratan**: Blaze plan / Google Cloud Project aktif, Google Artifact Registry / Container Registry.

### Opsi 3: Vercel Platform (Alternatif Direkomendasikan untuk Next.js 16)
- **Mekanisme**: Dibuat oleh tim Next.js, mendukung Next.js 16 App Router, Server Actions, Middleware, dan `@vercel/blob` (yang sudah terpasang di proyek) secara zero-config dan memiliki tier gratis tanpa kartu kredit.

---

## 3. Matriks Perbandingan

| Parameter | Firebase App Hosting | Docker di Google Cloud Run | Vercel (Alternatif) |
|---|---|---|---|
| Dukungan Server Actions & SSR | Ya (via Cloud Run terkelola) | Ya (Full control) | Ya (Native) |
| Kompatibilitas Prisma + Mongo | Memerlukan `prisma generate` saat build | Sangat stabil & terisolasi | Sangat stabil |
| Kemudahan Setup | Menengah (Perlu Blaze & Console Git link) | Lanjutan (Perlu Dockerfile & GCP) | Sangat mudah (1-click import) |
| Biaya Awal | Wajib kartu kredit (Blaze plan) | Wajib kartu kredit (GCP billing) | Gratis tanpa kartu kredit |
| Dukungan `@vercel/blob` | Perlu token manual dari Vercel | Perlu token manual dari Vercel | Langsung terintegrasi |
