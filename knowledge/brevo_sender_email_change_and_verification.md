# Panduan Penggantian Email Pengirim (Sender Email) Brevo API

## 1. Mekanisme Verifikasi Sender Brevo
Brevo API (khususnya endpoint transaksional `POST https://api.brevo.com/v3/smtp/email`) mewajibkan setiap email pengirim (`sender.email`) telah terdaftar dan terverifikasi di akun Brevo pemilik API Key.

Jika aplikasi mengirim email menggunakan alamat yang belum diverifikasi di Brevo, server Brevo akan menolak request dengan status `400 Bad Request` dan pesan:
`Key 'sender.email' is not valid or sender is not verified`.

## 2. Langkah Verifikasi di Dashboard Brevo
Untuk mendaftarkan `abedenstein12@gmail.com`:
1. Login ke [https://app.brevo.com](https://app.brevo.com).
2. Di pojok kanan atas, klik nama akun/profil -> pilih **Settings**.
3. Masuk ke menu **Senders, Domains & IPs** -> pilih tab **Senders** (atau langsung akses URL: `https://app.brevo.com/senders`).
4. Klik tombol **Add a sender** (Tambah pengirim).
5. Masukkan:
   - **From Name**: `ABI Homestay Reminder` (atau nama yang diinginkan).
   - **From Email**: `abedenstein12@gmail.com`.
6. Klik **Save**.
7. Brevo akan mengirimkan email konfirmasi / kode verifikasi 6-digit ke inbox `abedenstein12@gmail.com`.
8. Buka inbox `abedenstein12@gmail.com`, salin kode verifikasi, dan masukkan pada form konfirmasi di Brevo sampai statusnya menjadi **Active / Verified**.

## 3. Konfigurasi di Repositori Aplikasi
Setelah diverifikasi di Brevo, file konfigurasi berikut yang perlu disesuaikan:
1. `apphosting.yaml`:
   ```yaml
   - variable: BREVO_SENDER_EMAIL
     value: "abedenstein12@gmail.com"
     availability:
       - RUNTIME
   ```
2. `.env`:
   ```env
   BREVO_SENDER_EMAIL="abedenstein12@gmail.com"
   ```
3. `lib/email.ts`:
   Fallback default sender diganti menjadi `"abedenstein12@gmail.com"`.
