# Knowledge: Integrasi Email Reminder Pembayaran (Brevo API v3)

## 1. Analisis Kritis & Temuan Masalah (Critical Disagreements & Analysis)

Pengguna meminta penambahan fitur *email reminder* pembayaran menggunakan Brevo API:
> "i want to add email reminder for both all user to reminder pembayaran"
> API Key: `xkeysib-...`
> Senders: `abihomestayreminder@gmail.com` dan `titasaripratiwi8@gmail.com`

Berdasarkan investigasi menyeluruh pada basis kode saat ini, ditemukan beberapa isu kritis:

### Temuan Masalah Kritis:
1. **Model Prisma Belum Memiliki Field Email**:
   - Skema `Tenant` (`prisma/schema.prisma`) saat ini hanya menyimpan `name`, `phone`, `roomId`, `rentType`, `rentAmount`, `dateDue`, `dateIn`. **Tidak ada field `email` untuk penghuni**.
   - Skema `User` (`prisma/schema.prisma`) hanya menyimpan `username`, `name`, `password`, `role`, `status`. **Tidak ada field `email` untuk user admin/staff**.
2. **Koreksi Endpoint API Brevo (API Campaigns vs Transactional SMTP)**:
   - Cuplikan yang disalin pengguna adalah endpoint `/v3/emailCampaigns`. Endpoint ini ditujukan untuk *marketing blast/newsletter* yang mewajibkan `listIds` (daftar kontak Brevo).
   - Untuk notifikasi pengingat pembayaran tagihan (transaksional), endpoint standar resmi yang tepat adalah `POST https://api.brevo.com/v3/smtp/email` dengan *header* `api-key`. Endpoint ini tidak memerlukan pembuatan campaign atau list kontak terpisah.
3. **Ambiguitas Frasa "both all user"**:
   - Apakah email reminder ditujukan kepada:
     - **Opsi A**: Admin / Pengelola Homestay (menerima rangkuman daftar penghuni yang jatuh tempo).
     - **Opsi B**: Penghuni Kost (menerima tagihan personal per orang ke email masing-masing).
     - **Opsi C**: Keduanya (Penghuni menerima invoice tagihan per orang, DAN Pengelola/Admin menerima email ringkasan rekap jatuh tempo).
4. **Mekanisme Pemicu (Trigger Execution)**:
   - Apakah pengiriman email dilakukan secara otomatis harian (via background cron route `/api/cron/due-notif`)?
   - Apakah pengiriman dipicu secara manual oleh admin melalui tombol di halaman Penghuni / Notifikasi?
   - Atau kombinasi keduanya (otomatis tiap pagi jam 08:00 + tombol manual)?

---

## 2. 3 Opsi Solusi Arsitektur

### **Opsi 1: Rekap Otomatis ke Email Admin/Pengelola (Tanpa Ubah Skema Tenant - Zero Risk)**
- **Cara Kerja**:
  - Sistem memeriksa daftar penghuni yang jatuh tempo (`dateDue <= H+7`).
  - Mengirim 1 email rekapitulasi harian yang berisi daftar seluruh kamar dan penghuni yang harus ditagih ke email pengelola (`titasaripratiwi8@gmail.com` / `abihomestayreminder@gmail.com`).
  - Dilengkapi tombol manual "Kirim Rekap ke Email Sekarang" di halaman Pengaturan / Dashboard.
- **Kelebihan**:
  - Tidak perlu migrasi skema database Prisma untuk ratusan data penghuni.
  - Data penghuni lama tidak terdampak sama sekali.
  - Implementasi cepat, stabil, dan langsung berfungsi dengan API Key Brevo yang ada.
- **Kekurangan**:
  - Penghuni belum menerima email secara personal (penghuni tetap diingatkan via WhatsApp seperti alur saat ini).

### **Opsi 2: Email Personal ke Penghuni + Rekap ke Pengelola (Solusi Lengkap / Dual)**
- **Cara Kerja**:
  - Menambahkan kolom `email` (opsional/nullable) pada model `Tenant` di `prisma/schema.prisma`.
  - Memperbarui form Tambah/Edit Penghuni di `app/penghuni/page.tsx` untuk input email.
  - Tombol aksi "Kirim Pengingat Email" di samping tombol WhatsApp pada kartu jatuh tempo.
  - Sistem mengirim email pengingat resmi dengan template profesional HTML ke penghuni yang bersangkutan dan tembusan (Bcc) ke admin.
- **Kelebihan**:
  - Memenuhi definisi "both" secara penuh: penghuni dapat tagihan resmi via email, admin memiliki arsip.
  - Sangat profesional dan modern.
- **Kekurangan**:
  - Perlu penambahan field di form input penghuni dan pembaruan Prisma schema.

### **Opsi 3: Automated Cron Service dengan Switch On/Off di Halaman Pengaturan**
- **Cara Kerja**:
  - Membuat route handler `/api/cron/due-notif` yang diamankan dengan `CRON_SECRET`.
  - Di halaman `app/pengaturan/page.tsx`, menambahkan sakelar "Pengingat Email Otomatis" (Auto-Email Reminders) dan input "Email Tujuan Notifikasi".
  - Pengelola dapat mengatur email penerima notifikasi secara fleksibel tanpa mengubah kode.
- **Kelebihan**:
  - Pengelola memiliki kendali penuh untuk menyalakan/mematikan email pengingat dari UI.
  - Alamat email penerima dapat diganti sewaktu-waktu melalui menu Pengaturan.
- **Kekurangan**:
  - Memerlukan konfigurasi penjadwalan cron eksternal atau background runner.

---

## 3. Analisis Dampak Kode (Impact Analysis)
- **Komponen Terdampak**:
  - `.env` -> Penambahan `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.
  - `lib/email.ts` -> Modul modular untuk komunikasi dengan endpoint Brevo API v3 (`https://api.brevo.com/v3/smtp/email`).
  - `app/actions.ts` -> Server action untuk memicu pengiriman email pengingat.
  - `app/pengaturan/page.tsx` atau `components/Navigation.tsx` / `app/penghuni/page.tsx` -> Tombol aksi atau pengaturan konfigurasi.
- **Dampak Fungsional**:
  - Nol regresi pada fitur yang sudah ada (WhatsApp reminder, laporan transaksi, inventaris tetap berjalan 100% normal).

---

## 4. Hasil Implementasi & Pengujian

### A. File yang Diimplementasikan:
1. `lib/email.ts`: Modul modular native `fetch` ke endpoint resmi Brevo API v3 (`https://api.brevo.com/v3/smtp/email`). Dilengkapi builder HTML template email responsif untuk daftar tagihan jatuh tempo dan fungsi `sendDueReminderReport()`.
2. `app/actions.ts`: Menambahkan server action `sendDuePaymentReminderEmailAction()` yang terproteksi hak akses role (hanya ADMIN dan EDIT).
3. `app/api/cron/due-notif/route.ts`: Endpoint cron background otomatis (`GET` & `POST`) dengan validasi `CRON_SECRET` opsional.
4. `app/pengaturan/page.tsx`: Menambahkan baris konfigurasi "Pengingat Email" dengan tombol interaktif "Kirim Rekap" dan visual feedback status pengiriman (sukses/gagal).
5. `components/HomeDashboardClient.tsx`: Menambahkan tombol "Email Rekap" di samping judul seksyen "Jatuh Tempo & Perhatian" yang memicu pengiriman rekap instan.

### B. Temuan Kritis Saat Pengujian (Uji Brevo API):
Saat uji coba panggilan API dijalankan ke Brevo, server Brevo mengembalikan respon:
```json
{
  "message": "We have detected you are using an unrecognised IP address 110.138.85.133. If you performed this action make sure to add the new IP address in this link: https://app.brevo.com/security/authorised_ips",
  "code": "unauthorized"
}
```

### C. Solusi Otorisasi IP Brevo (PENTING untuk Pengguna):
Karena opsi "Blocking unauthorized IP addresses" pada akun Brevo Anda dalam status **Activated**:
1. **Solusi Terbaik (Direkomendasikan)**: Buka [https://app.brevo.com/security/authorised_ips](https://app.brevo.com/security/authorised_ips) lalu klik **"Deactivate for API keys"**. Ini memastikan serverless backend (seperti Vercel atau cloud deployment yang memiliki IP dinamis) tidak terblokir oleh filter IP Brevo.
2. **Solusi Alternatif**: Tambahkan IP `110.138.85.133` ke dalam daftar "Authorized IP addresses" di menu Brevo tersebut.
