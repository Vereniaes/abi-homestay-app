# Knowledge: Fitur Edit & Perpanjangan Jatuh Tempo Penghuni

## 1. Analisis Kebutuhan & Kondisi Saat Ini
Pengguna meminta: "Di bagian daftar penghuni di tambahkan edit untuk perpanjang jatuh tempo".

### Kondisi Eksisting:
1. **Frontend (`app/penghuni/page.tsx`)**:
   - Modal detail profil penghuni (`selectedTenant`) hanya menyediakan tombol "Hubungi via WhatsApp" dan "Hapus Penghuni".
   - Tidak ada tombol "Edit Penghuni" ataupun aksi perpanjangan masa sewa.
2. **Backend (`app/actions.ts`)**:
   - Hanya memiliki fungsi `addTenant` dan `deleteTenant`.
   - Belum ada fungsi mutasi `updateTenant` atau `extendTenantDueDate`.
3. **Logika Bisnis Jatuh Tempo (`lib/rent.ts`)**:
   - Fungsi `calculateDueDate(baseDate, rentType)` sudah tersedia untuk menghitung penambahan waktu (+1 hari, +1 minggu, +1 bulan, +6 bulan, +1 tahun).
   - Status tenant (`status`) saat ini:
     - `EXPIRING_SOON` jika jatuh tempo dalam 3 hari ke depan atau sudah lewat.
     - `ACTIVE` jika masa sewa masih panjang.
     - Jika diperpanjang, status tenant yang sebelumnya `EXPIRING_SOON` harus otomatis di-reset menjadi `ACTIVE`.

---

## 2. 3 Opsi Solusi Desain Fitur

### Opsi 1: Modal Edit Terpadu (Edit Data & Perpanjang Jatuh Tempo) - Rekomendasi Utama
- **Mekanisme**:
  - Menambahkan tombol "Edit / Perpanjang" di samping tombol Hapus pada modal detail penghuni.
  - Membuka modal form edit yang memungkinkan admin mengubah:
    - Nama, Nomor HP, Nomor Kamar.
    - Tanggal Jatuh Tempo (bisa memilih tombol instan "+1 Periode Sewa" atau memilih tanggal manual dari date-picker).
    - Status tenant otomatis diperbarui menjadi `ACTIVE` jika tanggal jatuh tempo baru > hari ini.
- **Kelebihan**: Fleksibel; bisa untuk perpanjang masa sewa sekaligus memperbaiki data penghuni jika ada salah input.

### Opsi 2: Tombol Aksi Cepat "Perpanjang Sewa (+1 Periode)"
- **Mekanisme**:
  - Menambahkan satu tombol khusus "Perpanjang 1 Bulan / Periode" di modal detail penghuni.
  - Sekali klik langsung memajukan `dateDue` berdasarkan `rentType` tenant saat ini (misal: jika bulanan, maju 1 bulan dari `dateDue` lama).
- **Kelebihan**: Sangat cepat tanpa perlu membuka form lagi.
- **Kekurangan**: Tidak bisa mengubah tanggal jatuh tempo secara custom jika penghuni membayar untuk durasi yang tidak standar.

### Opsi 3: Perpanjang Sewa Terintegrasi Transaksi Keuangan (Laporan)
- **Mekanisme**:
  - Modal perpanjangan meminta konfirmasi nominal pembayaran dan metode pembayaran, kemudian secara otomatis:
    1. Memperbarui `dateDue` tenant.
    2. Menambahkan catatan transaksi `INCOME` di riwayat Laporan Keuangan.
- **Kelebihan**: Data keuangan dan masa sewa sinkron 100%.
- **Kekurangan**: Membutuhkan alur konfirmasi upload bukti transfer atau nominal yang lebih panjang jika admin hanya ingin mengubah tanggal.
