# Knowledge: Analisis Masalah Notifikasi Tidak Muncul di Web (Desktop) vs HP

## 1. Identifikasi & Temuan Masalah Kritis
Pengguna melaporkan: "Di web tidak muncul notifikasi sedangkan di hp muncul".

Berdasarkan inspeksi kode di [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) dan perbandingan layout desktop vs mobile:

### A. Bug DOM Ref Collision (Pop-up Langsung Tertutup Otomatis)
- Komponen `renderNotificationWidget` dipanggil 2 kali secara simultan dalam satu pohon DOM:
  - Sekali di TopAppBar Mobile (`md:hidden`)
  - Sekali di SideNav Desktop (`hidden md:flex`)
- Keduanya memakai satu referensi `popoverRef` yang sama (`useRef<HTMLDivElement>(null)`).
- Di React, `ref` kedua menimpa `ref` pertama. Listener `handleClickOutside` memeriksa `popoverRef.current.contains(target)`. Ketika pengguna di web/desktop mengklik tombol atau isi popover, pengecekan `contains()` gagal karena referensi mengarah ke elemen mobile yang tersembunyi. Akibatnya, `setIsNotificationOpen(false)` langsung terpicu seketika saat diklik sehingga popover tidak pernah terbuka di layar desktop.

### B. Desain Penempatan Header yang Tidak Konsisten (UX Inconsistency)
- **Pada HP (Mobile)**: Terdapat TopAppBar tetap (`header.fixed.top-0`) yang menempatkan lonceng notifikasi di sudut kanan atas layar secara jelas.
- **Pada Web (Desktop)**: Tidak ada TopBar kanan atas. Lonceng notifikasi justru diselipkan di dalam sidebar navigasi kiri (`aside.w-64`) tepat di sebelah teks logo "Abi Homestay". Hal ini membuat pengguna tidak menemukan notifikasi di sudut kanan atas seperti halnya di HP.

### C. Masalah Ikon Ligatur Teks
- Font Material Symbols yang gagal muat menyebabkan tombol notifikasi tampil sebagai teks `notifications` yang bertumpuk dengan teks logo "Abi Homestay" di sidebar, merusak interaktivitas tombol.

---

## 2. 3 Opsi Solusi yang Dapat Diterapkan

### Solusi 1: Global Top Header Bar untuk Desktop & Pemisahan Ref (Rekomendasi Utama)
- **Mekanisme**:
  - Menghapus lonceng notifikasi dari dalam sidebar kiri.
  - Membuat TopBar header ringkas di desktop yang melayang di pojok kanan atas (`fixed top-4 right-6 z-40`), berisi info user dan widget notifikasi tersendiri dengan `ref` unik (`desktopPopoverRef`).
- **Kelebihan**: Posisi notifikasi di web desktop menjadi identik dengan HP (selalu di pojok kanan atas layar), tidak lagi bertumpuk di sidebar, dan bug ref tertutup otomatis tuntas 100%.

### Solusi 2: Pemisahan Ref & Dropdown Flyout pada Sidebar Desktop
- **Mekanisme**:
  - Mempertahankan tombol notifikasi di sidebar desktop, tetapi memisahkan `ref` menjadi `mobilePopoverRef` dan `desktopPopoverRef` agar tidak bertabrakan.
  - Memperbaiki z-index dan flyout ke arah kanan (`left-full`).
- **Kelebihan**: Tidak menambah elemen header baru di desktop.
- **Kekurangan**: Posisi notifikasi tetap di sidebar kiri, berbeda dari kebiasaan pengguna di HP (kanan atas).

### Solusi 3: Satukan Handler Ref Menjadi Array/Class Query Selector
- **Mekanisme**: Menggunakan query selector atau event stopPropagation pada wrapper tombol agar klik tidak tertutup oleh click outside.
