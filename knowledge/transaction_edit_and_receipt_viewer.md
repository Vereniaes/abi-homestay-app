# Knowledge: Fitur Edit Transaksi & Pratinjau Struk Bukti Pembayaran

## 1. Analisis Masalah Kritis & Kebutuhan Fitur
Pengguna meminta: "Di bagian laporan catatan transaksi harus bisa di edit dan struk harus bisa dilihat".

### Kondisi Saat Ini:
1. **Pratinjau Struk (`proofUrl`) Terbatas**:
   - Gambar struk bukti transfer saat ini hanya berupa thumbnail kecil berukuran 80x112 px (`w-20 h-28`).
   - Thumbnail tidak memiliki event `onClick` dan tidak bisa dibuka dalam ukuran penuh/modal fullscreen untuk memeriksa keaslian bukti transfer (nomor rekening pengirim, cap bank, nominal, dsb.).
   - Transaksi yang tidak mengunggah gambar bukti juga tidak memiliki tampilan struk nota/invoice digital resmi.
2. **Ketiadaan Fitur Edit Transaksi**:
   - Pada [app/laporan/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/laporan/page.tsx), tidak ada tombol "Edit Transaksi".
   - Di [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts), hanya ada `addTransaction` dan belum ada `updateTransaction`.
   - Admin tidak dapat mengoreksi kesalahan nominal input, mengganti kategori pengeluaran, mengubah tanggal transaksi, atau mengunggah ulang bukti struk yang salah.
3. **Integritas Rekapitulasi Keuangan**:
   - Total Pemasukan, Total Pengeluaran, dan Saldo Bersih dihitung berdasarkan agregat transaksi. Perubahan nominal transaksi harus langsung merevalidasi perhitungan kartu ringkasan tanpa inkonsistensi cache.

---

## 2. 3 Opsi Solusi Desain Fitur

### Opsi 1: Modal Lightbox Pratinjau Struk + Modal Form Edit Lengkap (Rekomendasi Utama)
- **Mekanisme**:
  - **Lihat Struk**: Thumbnail struk dapat diklik untuk membuka modal *Lightbox / Modal Pratinjau Struk* resolusi penuh (dengan tombol unduh / buka di tab baru). Jika transaksi tidak memiliki foto struk, disediakan tampilan Nota Struk Digital (Digital Invoice Receipt).
  - **Edit Transaksi**: Menambahkan tombol "Edit" pada setiap baris accordion transaksi yang membuka form edit: Nominal, Kategori/Deskripsi, Tanggal, dan opsi Ganti Foto Bukti Struk via `@vercel/blob`.
- **Kelebihan**: Pengalaman visual intuitif, fleksibel bagi admin dalam mengoreksi pembukuan.

### Opsi 2: Sheet Detail Transaksi Interaktif (View + Quick Inline Edit)
- **Mekanisme**:
  - Mengklik transaksi membuka panel bawah (bottom sheet) yang menampilkan struk besar di bagian atas dan field formulir yang dapat langsung diedit di bagian bawahnya.
- **Kelebihan**: Menggabungkan lihat struk dan edit dalam satu tampilan sekaligus.

### Opsi 3: Modal Struk Digital dengan Tombol Edit di Dalamnya
- **Mekanisme**:
  - Mengklik tombol "Lihat Struk" membuka modal struk faktur lengkap. Di dalam modal struk tersebut terdapat tombol "Edit Data Transaksi".
- **Kelebihan**: Alur bertahap yang menjaga tampilan daftar tetap ringkas.
