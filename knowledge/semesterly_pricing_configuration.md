# Konfigurasi Tarif Sewa 6 Bulan (Semesteran) pada Master Harga

## Latar Belakang
Sistem ABI Homestay telah mendukung enum `RentType.SEMESTERLY` pada modul sewa dan laporan keuangan, namun sebelumnya belum memiliki konfigurasi dinamis pada Master Harga Sewa (nilai sewa dihitung otomatis secara hardcoded di `lib/rent.ts`).

## Rincian Implementasi
1. **Prisma Schema (`prisma/schema.prisma`)**:
   - Menambahkan field `semesterlyPrice Float @default(14000000)` pada model `Pricing`.
   - Menjalankan `npx prisma generate` untuk memperbarui klien database.
2. **Server Actions (`app/actions.ts`)**:
   - `getPricingAndSettings()`: Memuat `semesterlyPrice` dengan nilai default fallback Rp 14.000.000 jika dokumen database belum memiliki atribut tersebut.
   - `updatePricing(pricingId, dailyPrice, weeklyPrice, monthlyPrice, semesterlyPrice, yearlyPrice)`: Memperbarui nilai tarif 6 bulan ke database.
3. **Modul Sewa (`lib/rent.ts`)**:
   - `getRentAmount("SEMESTERLY", pricing)`: Membaca secara dinamis `pricing.semesterlyPrice || 14000000`.
4. **Antarmuka Pengaturan (`app/pengaturan/page.tsx`)**:
   - Menambahkan state `semesterly` dengan pemformatan rupiah `toLocaleString("id-ID")`.
   - Menambahkan input *"Tarif 6 Bulan (Semesteran)"* pada modal Master Harga Sewa di antara Tarif Bulanan dan Tarif Tahunan.
