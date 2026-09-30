# Knowledge: Tombol Manual Pengingat Email Per Kamar & Konfigurasi Email Rekap di Pengaturan

## 1. Ikhtisar Fitur
Berdasarkan arahan pengguna, sistem pengingat email kini dilengkapi dua kapabilitas baru:
1. **Konfigurasi Dinamis Email Rekap (Summary)** di Menu Pengaturan (`/pengaturan`).
2. **Tombol Manual Pengingat Email Per Kamar / Penghuni** di Modal Detail Kamar (`/kamar`) dan Modal Detail Penghuni (`/penghuni`).

---

## 2. Rincian Teknis Implementasi

### A. Pengaturan Email Rekapitulasi Tagihan (`Setting.reminderRecipientEmail`)
- **Skema Database (`prisma/schema.prisma`)**:
  - Kolom baru `reminderRecipientEmail String? @default("titasaripratiwi8@gmail.com")` pada model `Setting`.
- **Integrasi Server Action & Email Helper**:
  - [`getPricingAndSettings`](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts): Mengambil konfigurasi setting termasuk `reminderRecipientEmail`.
  - [`updateSetting`](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts): Memperbarui `reminderRecipientEmail` di basis data.
  - [`sendDueReminderReport`](file:///home/vereniaes/project/abi-homestay-app/lib/email.ts): Memprioritaskan pembacaan alamat email rekap dari tabel `Setting`, dengan fallback ke `.env.REMINDER_RECIPIENT_EMAIL` dan nilai default `titasaripratiwi8@gmail.com`.
- **UI Menu Pengaturan ([app/pengaturan/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx))**:
  - Menampilkan alamat email yang sedang aktif pada ringkasan kartu Operasional.
  - Form input dinamis dan tombol **"Simpan"** pada modal `Email Pengingat & Rekap Tagihan`.

### B. Tombol Manual Pengingat Email Per Penghuni
- **Fungsi Helper Modular ([lib/email.ts](file:///home/vereniaes/project/abi-homestay-app/lib/email.ts))**:
  - [`sendSingleTenantReminder(tenantId)`](file:///home/vereniaes/project/abi-homestay-app/lib/email.ts):
    1. Mengambil data penghuni dan kamar dari basis data.
    2. Memvalidasi kepemilikan email penghuni (`email.includes("@")`).
    3. Menghitung `daysLeft` (selisih hari terhadap `dateDue`).
    4. Mengirimkan email notifikasi tagihan personal via Brevo API v3.
- **Server Action ([app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts))**:
  - [`sendManualTenantReminderAction(tenantId)`](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts): Memvalidasi hak akses role (menolak role `VIEW`) dan memanggil fungsi pengiriman email.
- **Modal Detail Kamar ([app/kamar/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx))**:
  - Pada setiap kartu penghuni di dalam kamar, disediakan tombol **"Kirim Email Pengingat"**.
  - Dilengkapi indikator loading interaktif (`animate-spin`), status pengiriman, serta validasi jika penghuni belum memiliki email.
- **Modal Detail Penghuni ([app/penghuni/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx))**:
  - Disediakan tombol **"Kirim Email"** di samping tombol **"WhatsApp"** dengan respons notifikasi hasil pengiriman.

---

## 3. Validasi
- `npx prisma generate && npx prisma db push`: Sinkronisasi skema MongoDB sukses 100%.
- `npx tsc --noEmit`: Lolos type checking 0 error.
- `npm run build`: Kompilasi Next.js produksi lolos 100%.
