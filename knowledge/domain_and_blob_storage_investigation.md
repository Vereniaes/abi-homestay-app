# Knowledge: Analisis Masalah Domain .my.id dan Vercel Blob Storage

## 1. Ringkasan Investigasi

Berdasarkan pesan suara (Voice Note) dan pertanyaan terkait kenapa domain `.my.id` tidak muncul di profil Chrome pengguna tetapi muncul di akun Chrome lain:

### Temuan Kritis 1: Konflik DNS Ganda (Double A-Record) pada `abihomestay.my.id`
Pengecekan DNS publik (`dig abihomestay.my.id`) menunjukkan domain memiliki 2 A-record aktif yang mengarah ke 2 penyedia hosting berbeda:
- `216.198.79.1` -> **Vercel**
- `35.219.201.33` -> **Google Cloud / Firebase App Hosting**

**Dampak pada Browser Chrome**:
- Setiap profil Chrome dapat memiliki pengaturan **Secure DNS (DNS over HTTPS / DoH)** dan cache DNS internal (`chrome://net-internals/#dns`) yang berbeda.
- Jika profil Chrome A menggunakan DoH (Google/Cloudflare) yang me-resolve ke Vercel atau Firebase, sementara profil Chrome B menggunakan DNS ISP lokal (yang mungkin mengalami stale DNS atau gagal handshake ke salah satu IP), salah satu profil akan gagal memuat web atau menampilkan versi yang berbeda.

---

### Temuan Kritis 2: Perbedaan Sesi Login & Role RBAC Antar-Profil Chrome
Di dalam [middleware.ts](file:///home/vereniaes/project/abi-homestay-app/middleware.ts) dan [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx):
- Menu dan rute `/laporan` (tempat transaksi dan bukti transfer) **hanya dapat diakses oleh role ADMIN**.
- Jika profil Chrome pengguna login dengan role `VIEW` atau `EDIT`, menu Laporan tidak muncul di navigasi, dan akses ke `/laporan` langsung dialihkan ke beranda `/`.
- Jika profil Chrome lain login sebagai `ADMIN`, seluruh riwayat transaksi dan struk terlihat normal.

---

### Temuan Kritis 3: Masalah Bukti Transaksi (Vercel Blob Storage)
Pemeriksaan data transaksi terbaru di MongoDB Atlas:
- Terdapat 3 transaksi baru yang dibuat pada 12 September 2026 (`TRX-666129`, `TRX-171323`, `TRX-771909`).
- **Seluruh transaksi tersebut memiliki `proofUrl: null`**.
- Penyebab:
  1. Jika transaksi diinput melalui deployment Firebase App Hosting, environment variable `BLOB_READ_WRITE_TOKEN` belum dimasukkan ke Google Cloud Secret Manager / Firebase App Hosting Console.
  2. Batasan ukuran berkas di [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts) baris 684 membatasi maksimal 1MB. Foto kamera smartphone umumnya berukuran 2MB–6MB sehingga unggahan langsung dilewati (*silently skipped*).

---

## 2. 3 Solusi yang Direkomendasikan

### Solusi 1: Pembersihan DNS Record & Penyelarasan Host Tunggal (Rekomendasi Utama)
- Menghapus A-record yang tidak digunakan pada DNS Manager domain `abihomestay.my.id` (pilih salah satu: hanya Vercel atau hanya Firebase App Hosting).
- Membersihkan Host Resolver Cache di Chrome (`chrome://net-internals/#dns` -> Clear host cache).

### Solusi 2: Pengecekan Akun & Role pada Profil Chrome
- Memeriksa role akun yang sedang login di pojok kanan atas profil Chrome pengguna.
- Pastikan login menggunakan akun ber-role `ADMIN` jika ingin melihat menu dan data `/laporan`.
- Bersihkan cookie sesi via tombol Keluar/Logout atau hapus cache browser jika role masih tersangkut pada versi `VIEW`.

### Solusi 3: Perbaikan Konfigurasi Blob Storage & Kompresi Foto
- Mengonfigurasi `BLOB_READ_WRITE_TOKEN` pada environment hosting yang aktif (Vercel atau Firebase).
- Menambahkan kompresi gambar otomatis sisi klien (client-side compression via canvas) sebelum pengiriman FormData agar ukuran berkas selalu di bawah 1MB dan tidak gagal diupload.
