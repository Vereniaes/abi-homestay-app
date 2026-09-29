# Knowledge: Pengingat Pembayaran Personal Penghuni (H-5 dan H-3) via Brevo API v3

## 1. Analisis Kritis & Temuan Masalah

Pengguna meminta penambahan fitur pengingat pembayaran per individu penghuni pada interval waktu:
- **H-5** (5 hari sebelum jatuh tempo)
- **H-3** (3 hari sebelum jatuh tempo)
Dikirim secara personal ke alamat email masing-masing penghuni.

### Temuan Kritis:
1. **Data Email Penghuni Saat Ini Kosong (0 dari 46 Penghuni)**:
   - Berdasarkan kueri basis data aktif, seluruh 46 penghuni aktif memiliki nilai `email: null`.
   - Jika sistem pengingat diaktifkan sekarang, tidak ada email penghuni yang dapat dikirim sampai pengelola mengisi email penghuni di form `app/penghuni/page.tsx`.
2. **Kebutuhan Template Dinamis (H-5 vs H-3)**:
   - Template saat ini di `lib/email.ts` terikat secara statis pada teks H-3.
   - Diperlukan generator template yang menerima parameter `daysLeft: 5 | 3` agar subjek, urgensi pesan, dan instruksi pembayaran tampil presisi.
3. **Efisiensi Cloud Scheduler & Endpoint Cron**:
   - Job Cloud Scheduler yang saat ini aktif di GCP memanggil `/api/cron/due-notif`.
   - Menggabungkan eksekusi pengingat personal (H-5 & H-3) dan rekapitulasi pengelola dalam 1 siklus cron harian akan menghemat pemanggilan jaringan dan menyederhanakan arsitektur.

---

## 2. Pilihan Solusi Teknis

### Solusi 1 (Rekomendasi Utama): Pipeline Terpadu H-5 & H-3 + Rekap Status Pengelola
- Fungsi `processTenantDueReminders()` memeriksa penghuni yang jatuh tempo di H-5 dan H-3.
- Mengirimkan email tagihan personal ke setiap penghuni yang memiliki email via Brevo API v3.
- Rangkuman status (jumlah email terkirim, gagal, atau dilewati karena belum ada email) disertakan ke email rekap pengelola harian.
- Menggunakan endpoint `/api/cron/due-notif` yang sudah terhubung ke Cloud Scheduler aktif.

### Solusi 2: Dua Endpoint Terpisah dengan 2 Job Cloud Scheduler
- `/api/cron/reminders` khusus untuk blast email personal ke penghuni (H-5 dan H-3).
- `/api/cron/due-notif` khusus untuk rekap pengelola.
- Memerlukan konfigurasi job scheduler kedua di GCP.

### Solusi 3: Otomatisasi Harian + Tombol Manual Kirim Email di Halaman Penghuni
- Mengimplementasikan Solusi 1 untuk cron harian, ditambah tombol "Kirim Email" di samping tombol WhatsApp pada kartu jatuh tempo di halaman `app/penghuni/page.tsx`.
- Pengelola dapat mengirim email tagihan instan kapan pun diperlukan.

---

## 3. Rencana Kerja & Status Implementasi

- [x] Konfirmasi pendekatan: **Solusi 1 (Pipeline Terpadu H-5 & H-3 + Rekap Pengelola via Brevo API v3)**.
- [x] Perbarui [lib/email.ts](file:///home/vereniaes/project/abi-homestay-app/lib/email.ts):
  - `generateDueReminderHtml` mendukung parameter dinamis `daysLeft: 5 | 3`.
  - Fungsi modular `processTenantDueReminders(daysAhead)` untuk memproses batch pengiriman email personal ke penghuni.
  - Fungsi `sendDueReminderReport` mengorkestrasi H-5, H-3, dan rangkuman status ke email pengelola (`titasaripratiwi8@gmail.com`).
- [x] Perbarui [app/api/cron/reminders/route.ts](file:///home/vereniaes/project/abi-homestay-app/app/api/cron/reminders/route.ts) untuk memanfaatkan `processTenantDueReminders(5)` dan `processTenantDueReminders(3)`.
- [x] Perbarui [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts) agar `triggerDueRemindersAction` memicu pengingat H-5 dan H-3 secara terpadu.
- [x] Perbarui label di [app/penghuni/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx) menjadi `Email Pengingat (H-5 & H-3)`.
- [x] Validasi type check (`npx tsc --noEmit`) lolos 0 error.
- [x] Verifikasi build produksi (`npm run build`) berhasil 100%.
