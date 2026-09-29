# Audit & Analisis: Pengingat Pembayaran Email & Konfigurasi GCP abi-homestay

## 1. Analisis Kritis & Temuan Masalah

Berdasarkan data terbaru dari Google Cloud Console dan permintaan pengguna ("i want to add email reminder for both all user to reminder pembayaran"):

### Temuan Kritis:
1. **Identifikasi Project Google Cloud**:
   - Project ID sebelumnya yang gagal: `named-flag-483623-c0` (permission denied).
   - Project ID aktual yang benar: `abi-homestay` (Project Number: `410659068205`).
   - Service account aktif pada project `abi-homestay`:
     - `firebase-app-hosting-compute@abi-homestay.iam.gserviceaccount.com` (Firebase App Hosting)
     - `410659068205-compute@developer.gserviceaccount.com` (Default Compute)
     - `firebase-adminsdk-fbsvc@abi-homestay.iam.gserviceaccount.com` (Admin SDK)

2. **Keterbatasan Skema Database untuk Email Penghuni**:
   - Model `Tenant` pada `prisma/schema.prisma` hanya memiliki field: `name`, `phone`, `roomId`, `rentType`, `rentAmount`, `dateDue`, `dateIn`.
   - **Tidak ada field `email`** pada data penghuni kost saat ini.
   - Form pendaftaran penghuni di antarmuka web juga belum memiliki kolom input email.

3. **Ambiguitas "Both All User"**:
   - Apakah sistem diharapkan mengirim:
     - Email personal tagihan ke setiap penghuni (memerlukan penambahan field `email` di database dan form UI).
     - Email rekapitulasi harian ke seluruh staf/admin yang terdaftar di tabel `User`.
     - Atau penyelesaian otomatisasi Cloud Scheduler harian untuk project `abi-homestay`.

---

## 2. Pilihan Solusi Teknis

### Solusi 1: Fokus Otomatisasi Cloud Scheduler pada Project `abi-homestay` (Rekomendasi Tahap 1)
- Memperbarui skrip dan konfigurasi Cloud Scheduler untuk project `abi-homestay`.
- Mendaftarkan secret `BREVO_API_KEY` dan `CRON_SECRET` ke Google Cloud Secret Manager.
- Memberikan hak `roles/secretmanager.secretAccessor` kepada `firebase-app-hosting-compute@abi-homestay.iam.gserviceaccount.com`.
- Email rekap tagihan jatuh tempo terkirim otomatis setiap hari pukul 08:00 WIB ke pengelola.

### Solusi 2: Penambahan Email Personal Penghuni + Rekap Admin (Dual Reminder)
- Menambahkan field `email` (opsional) pada model `Tenant` di `prisma/schema.prisma`.
- Memperbarui antarmuka `app/penghuni/page.tsx` (tambah input email pada modal penghuni).
- Membuat fungsi pengiriman email tagihan individu per penghuni melalui Brevo API v3.
- Mengirimkan salinan (Bcc) atau rekapitulasi ke admin.

### Solusi 3: Pengingat Multikanal (WhatsApp Penghuni + Email Rekap Seluruh User Admin)
- Tetap menggunakan WhatsApp untuk pengingat langsung ke penghuni (nomor kontak sudah 100% tersedia).
- Memodifikasi fungsi rekap email agar dikirimkan ke seluruh akun di tabel `User` dengan role `ADMIN`.

---

## 3. Rencana Kerja & Status Eksekusi

- [x] Konfirmasi pendekatan dengan pengguna: **Opsi 1 (Setup Cloud Scheduler & Secret Manager untuk project `abi-homestay`)**.
- [x] Perbarui skrip setup dan IAM binding untuk `firebase-app-hosting-compute@abi-homestay.iam.gserviceaccount.com`.
- [x] Validasi integritas kode TypeScript (`npx tsc --noEmit` lolos 0 error).
- [x] Eksekusi perintah setup di Google Cloud Console / Cloud Shell untuk project `abi-homestay` (Job: `abi-homestay-due-reminder` berstatus `ENABLED`).
- [x] Selesaikan rekonsiliasi merge conflict 4 berkas (`app/actions.ts`, `app/pengaturan/page.tsx`, `components/HomeDashboardClient.tsx`, `lib/email.ts`).
- [x] Verifikasi build produksi (`npm run build`) berhasil 100% (semua 11 rute termasuk `/api/cron/due-notif` dan `/api/cron/reminders` siap).
- [x] Deployment Firebase App Hosting berhasil tayang (*Revision: Ready=True*).
- [x] Uji pemicuan endpoint produksi `/api/cron/due-notif` via domain `hosted.app` berhasil (`HTTP 200: Email rekap terkirim ke titasaripratiwi8@gmail.com untuk 9 penghuni`).

---

## 4. Perintah Eksekusi Siap Pakai di Cloud Shell (Project abi-homestay)

Jalankan perintah berikut di Cloud Shell Google Cloud Console (ikon terminal di kanan atas):

```bash
PROJECT_ID="abi-homestay"
REGION="asia-southeast2"
CRON_SECRET="${CRON_SECRET:-YOUR_CRON_SECRET}"
BREVO_API_KEY="${BREVO_API_KEY:-YOUR_BREVO_API_KEY}"
APP_HOSTING_SA="firebase-app-hosting-compute@abi-homestay.iam.gserviceaccount.com"

# 1. Enable APIs
gcloud services enable cloudscheduler.googleapis.com secretmanager.googleapis.com --project="${PROJECT_ID}"

# 2. Buat Secrets
echo -n "${BREVO_API_KEY}" | gcloud secrets create BREVO_API_KEY --data-file=- --project="${PROJECT_ID}" || echo -n "${BREVO_API_KEY}" | gcloud secrets versions add BREVO_API_KEY --data-file=- --project="${PROJECT_ID}"
echo -n "${CRON_SECRET}" | gcloud secrets create CRON_SECRET --data-file=- --project="${PROJECT_ID}" || echo -n "${CRON_SECRET}" | gcloud secrets versions add CRON_SECRET --data-file=- --project="${PROJECT_ID}"

# 3. Izin Secret Accessor untuk Firebase App Hosting
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${APP_HOSTING_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None

# 4. Buat Job Scheduler Harian 08:00 WIB (01:00 UTC)
# Catatan: Ganti https://abi-homestay-app.web.app dengan domain App Hosting Anda jika berbeda
APP_URL="https://abi-homestay-app.web.app"
gcloud scheduler jobs create http abi-homestay-due-reminder \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --schedule="0 1 * * *" \
  --time-zone="Asia/Jakarta" \
  --uri="${APP_URL}/api/cron/due-notif" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --attempt-deadline=60s \
  --description="Email pengingat sewa jatuh tempo ABI Homestay (harian 08:00 WIB)" || \
gcloud scheduler jobs update http abi-homestay-due-reminder \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --schedule="0 1 * * *" \
  --time-zone="Asia/Jakarta" \
  --uri="${APP_URL}/api/cron/due-notif" \
  --http-method=GET \
  --headers="Authorization=Bearer ${CRON_SECRET}" \
  --attempt-deadline=60s
```

