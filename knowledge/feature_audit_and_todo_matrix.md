# Knowledge: Audit Kelayakan Fitur & Matriks Status 10 Item Permintaan

Dokumen ini berisi hasil audit komprehensif terhadap 10 butir fitur dan kendala yang diajukan oleh pengguna.

---

## Matriks Evaluasi 10 Fitur

| No | Fitur / Kendala | Status Saat Ini | Detail Temuan & Tindak Lanjut |
|---|---|---|---|
| 1 | **Di web tidak muncul notifikasi sedangkan di hp muncul** | ✅ **SUDAH SELESAI** | Ref ganda dipisahkan (`mobilePopoverRef` & `desktopPopoverRef`), ditambahkan Floating Notification Widget di sudut kanan atas desktop di `components/Navigation.tsx`. |
| 2 | **Daftar penghuni: edit untuk perpanjang jatuh tempo** | ✅ **SUDAH SELESAI** | Tombol perpanjang jatuh tempo instan (+1 siklus sewa) dan form edit tanggal telah terintegrasi di modal detail penghuni (`app/penghuni/page.tsx`). |
| 3 | **Laporan transaksi bisa di-edit dan struk bisa dilihat** | ✅ **SUDAH SELESAI** | Modal Receipt Viewer resolusi tinggi dan Modal Edit Transaksi terhubung ke streaming route `/api/receipts` dan private blob store. 2 sampel struk bank (BCA & Mandiri) aktif. |
| 4 | **Web tiba-tiba ngebug saat pertengahan diakses** | ✅ **SUDAH SELESAI** | Singleton Prisma universal di `lib/prisma.ts` telah diaktifkan tanpa batasan environment, mencegah kebocoran koneksi pool di MongoDB Atlas. |
| 5 | **Pengaturan 6 bulan 8jt** | ✅ **SUDAH SELESAI** | Tarif sewa 6 bulan disesuaikan menjadi Rp 8.000.000 di `prisma/schema.prisma`, `lib/rent.ts`, `app/actions.ts`, `app/pengaturan/page.tsx`, serta data MongoDB Atlas. |
| 6 | **Pusat bantuan ganti guide book cara penggunaan apps** | ⏳ **SIAP DIKERJAKAN** | Akan merombak modal Pusat Bantuan di `app/pengaturan/page.tsx` menjadi Buku Panduan (Guide Book) interaktif per modul sistem. |
| 7 | **Laporan keuangan cukup hanya bisa diakses oleh 2 orang saja** | ⏳ **SIAP DIKERJAKAN** | Rute `/laporan` sudah terproteksi role `ADMIN`. Akan ditambahkan proteksi ketat kuota maksimal 2 user role `ADMIN` di `app/actions.ts` dan `app/users/page.tsx`. |
| 8 | **Opsi dark mode** | ✅ **SUDAH SELESAI** | Sakelar Mode Gelap di `app/pengaturan/page.tsx` dan CSS variable theme engine di `app/globals.css` sudah aktif penuh. |
| 9 | **Absen penjaga harian kost (optional)** | 📋 **OPSIONAL (ANTREAN)** | Fitur presensi harian penjaga kost (masuk, keluar, catatan shift). |
| 10 | **Jumlah penghuni per kamar** | ✅ **SUDAH SELESAI** | Kartu kamar di `app/kamar/page.tsx` kini menampilkan badge kapasitas visual interaktif (`0/2`, `1/2`, `2/2 Penuh`) secara sekilas. |
