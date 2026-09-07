# Knowledge: Navigasi Direct Link & Auto-Open Modal Detail Kamar

## Overview
Dokumen ini mencatat rancangan dan implementasi fitur navigasi langsung (direct link) dari notifikasi perbaikan kamar ke modal detail kamar spesifik di halaman `/kamar`.

## 1. Analisis & Masalah Sebelumnya
- **Masalah**: Tombol **Detail** pada notifikasi perbaikan kamar di [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) hanya mengarahkan pengguna ke halaman generik `href="/kamar"`.
- **Pengalaman Pengguna (UX)**: Pengguna harus mencari dan mengklik kartu kamar secara manual untuk melihat detail perbaikan kamar yang dimaksud dalam notifikasi.

## 2. Kesepakatan Desain (Hasil /grill-me)
1. **Tautan Spesifik Notifikasi**:
   - Di [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx), tombol Detail diubah menjadi `href={`/kamar?room=${encodeURIComponent(room.number)}`}`.
2. **Pembacaan URL Parameter & Auto-Open Modal**:
   - Di [app/kamar/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx), memanfaatkan `useSearchParams()` dari Next.js `next/navigation`.
   - Setelah daftar `rooms` selesai dimuat dari backend, sistem mencocokkan nomor kamar (`r.number === roomQuery` / `r.number.toLowerCase() === roomQuery.toLowerCase()`).
   - Apabila cocok, modal detail kamar tersebut dipanggil secara otomatis via `openModal(targetRoom)`.
3. **Pembersihan URL Parameter (Clean Dismiss)**:
   - Saat modal detail kamar ditutup oleh pengguna (`closeModal()`), URL parameter dibersihkan kembali ke `/kamar` menggunakan `window.history.replaceState({}, '', '/kamar')` secara halus tanpa melakukan full page reload.

## 3. Komponen & File Terdampak
- [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) -> Pembaruan `href` tombol Detail notifikasi kamar perbaikan.
- [app/kamar/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx) -> Penambahan `useSearchParams()` dan logika auto-open modal detail kamar.
