# Perbaikan Modal Pratinjau Struk Menciut (Width Collapse Fix)

## Masalah yang Ditemukan
Saat pengguna mengklik tombol "Lihat Struk" pada kartu riwayat transaksi di halaman Laporan (`/laporan`), modal pop-up pratinjau struk pembayaran menyusut/menciut secara horizontal menjadi garis putih vertikal tipis (~30px) di tengah layar.

## Akar Penyebab
1. **Ketidaksesuaian Arsitektur Modal**:
   Modal struk sebelumnya menggunakan `flex items-center justify-center p-4` dengan child `relative w-full max-w-lg overflow-y-auto` tanpa explicit width container.
2. **Perilaku Flexbox pada Tailwind v4**:
   Ketika kontainer flexbox memiliki child tanpa ukuran lebar eksplisit (`md:w-[520px]`) dan mengalami overflow vertikal, browser mereduksi lebar elemen ke *minimum intrinsic width* (sehingga hanya selebar batang scrollbar).

## Solusi yang Diimplementasikan
Mengikuti standar arsitektur **Universal Modal Fix** yang terbukti kokoh di aplikasi:
1. **Outer Viewport Container**:
   `<div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4">`
2. **Inner Card Container**:
   `<div className="relative w-full md:w-[520px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] pb-safe animate-slide-up overflow-hidden z-10">`
3. **Struktur Terisolasi Tiga Bagian**:
   - **Header Tetap (Sticky Header)**: Memuat ikon struk, judul, nomor referensi, dan tombol tutup (`close`).
   - **Badan Scrollable (`overflow-y-auto flex-1`)**: Menampung gambar bukti transfer atau nota digital resmi tanda terima pembayaran.
   - **Tombol Aksi**: Buka Gambar Penuh dan Unduh Struk.
   - **Mobile**: Menjadi *bottom sheet* elegan menempel di bawah layar.
   - **Desktop**: Menjadi dialog terpusat 520px di tengah layar tanpa risiko menciut.
