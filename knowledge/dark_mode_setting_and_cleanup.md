# Pengaturan Mode Gelap & Pembersihan Menu Keamanan Akun

## Ringkasan Perubahan
1. **Ganti Auto-WhatsApp Menjadi Mode Gelap**:
   - Di halaman `app/pengaturan/page.tsx`, opsi "Auto-WhatsApp Reminders" digantikan dengan sakelar interaktif "Mode Gelap".
   - Menggunakan state `isDarkMode`, memanipulasi class `.dark` pada elemen `<html>` (`document.documentElement`), dan menyimpan preferensi ke `localStorage` dengan key `"theme"`.
   - Menggunakan icon Material Symbols `dark_mode`.
2. **Pencegahan Flicker pada Initial Load**:
   - Di `app/layout.tsx`, ditambahkan inline script pada tag `<head>` untuk mengecek `localStorage.getItem("theme")` dan sistem preferensi `prefers-color-scheme: dark` sebelum rendering selesai, sehingga tidak terjadi flicker putih saat reload.
   - Atribut `suppressHydrationWarning` disematkan pada tag `<html>`.
3. **Pembersihan Menu Keamanan Akun**:
   - Menu item "Keamanan Akun (Password & Akses staf)" dihapus dari kartu pengaturan sistem.
   - Tombol "Keluar dari Akun" (Logout) dipertahankan di bagian bawah kartu dengan pemisah garis tunggal.
