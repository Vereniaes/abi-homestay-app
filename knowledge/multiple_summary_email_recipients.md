# Konfigurasi Multi-Email Penerima Rekap Tagihan (Summary)

## 1. Latar Belakang & Kebutuhan
Sebelumnya, laporan rekap harian tagihan sewa hanya dapat dikirimkan ke 1 alamat email pengelola (`reminderRecipientEmail`). Pengelola membutuhkan fleksibilitas agar rekapitulasi dapat dikirimkan sekaligus ke banyak alamat email pengelola/tim administrasi.

## 2. Struktur Basis Data (`prisma/schema.prisma`)
Pada model `Setting`:
- Ditambahkan kolom `reminderRecipientEmails String[]` untuk menyimpan array daftar email secara native di MongoDB.
- Kolom legacy `reminderRecipientEmail String?` tetap dipertahankan dan disinkronkan (berisi string gabungan comma-separated) untuk menjamin backward compatibility 100%.

```prisma
model Setting {
  id                      String   @id @default(auto()) @map("_id") @db.ObjectId
  autoWhatsappReminders   Boolean  @default(true)
  reminderRecipientEmail  String?  @default("titasaripratiwi8@gmail.com")
  reminderRecipientEmails String[]
  updatedAt               DateTime @updatedAt
}
```

## 3. Server Actions (`app/actions.ts`)
1. **`getPricingAndSettings()`**:
   - Memastikan `reminderRecipientEmails` terisi dengan fallback ke `reminderRecipientEmail` atau email default (`titasaripratiwi8@gmail.com`).
2. **`updateSetting()`**:
   - Menerima parameter `reminderRecipientEmails?: string[]`.
   - Melakukan validasi, normalisasi (lowercase & trim), serta deduplikasi alamat email.
   - Menyimpan array ke `reminderRecipientEmails` dan string gabungan ke `reminderRecipientEmail`.

## 4. Mesin Pengiriman Email (`lib/email.ts`)
Pada fungsi `sendDueReminderReport()`:
- Membaca daftar penerima dari parameter atau tabel `Setting.reminderRecipientEmails`.
- Memvalidasi dan menduplikasi seluruh email aktif.
- Memetakan ke struktur penerima Brevo API v3:
  ```ts
  to: finalRecipients.map((email) => ({
    email,
    name: "Pengelola ABI Homestay",
  }))
  ```
- Pesan status pengiriman mencantumkan seluruh alamat email penerima yang dituju.

## 5. Antarmuka Pengguna (`app/pengaturan/page.tsx`)
1. **Ringkasan di Menu Tampilan & Sistem**:
   - Menampilkan jumlah pengelola terdaftar beserta cuplikan email aktif.
2. **Modal Email Pengingat & Rekap Tagihan**:
   - **Daftar Email Penerima**: Setiap email ditampilkan dalam kartu rapi dengan ikon email dan tombol hapus (`close`).
   - **Proteksi Hapus**: Minimal harus tersisa 1 email penerima aktif.
   - **Form Tambah Email**: Dilengkapi validasi format regex email dan pencegahan duplikasi email sebelum ditambahkan ke daftar.
   - **Tombol Simpan**: Menyimpan seluruh daftar penerima ke database secara transaksional.

## 6. Pengujian & Validasi
- `npx prisma db push && npx prisma generate`: Berhasil sinkron ke MongoDB Atlas.
- `npx tsc --noEmit`: 0 error.
- `npm run build`: Berhasil mengompilasi seluruh route.
