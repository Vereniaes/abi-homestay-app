# Knowledge: Perbaikan Posisi Popover Notifikasi & Panduan Pengujian

## 1. Analisis Permasalahan Visual (UI Bug Analysis)

### Teridentifikasi 2 Masalah Posisi Popover:
1. **Mobile / Viewport Sempit (Gambar 1)**:
   - Popover menggunakan `absolute right-0 top-12 w-80 sm:w-96`.
   - Pada layar HP/Tablet, lebar `w-80` (320px) yang terikat `right-0` meluap melampaui batas kiri layar (*overflow left edge*), sehingga judul dan isi notifikasi di sebelah kiri terpotong (*clipped*).
2. **Desktop SideNav (Gambar 2)**:
   - Sidebar desktop (`aside`) memiliki lebar terbatas `w-64` (256px) dan posisi `fixed left-0`.
   - Penempatan popover `right-0` di dalam tombol sidebar menyebabkan popover muncul terdorong ke kiri layar hingga keluar dari area monitor.

---

## 2. 3 Opsi Solusi Perbaikan UI Popover (3 UI Options)

### **Opsi 1: Responsive Layout Alignment & Responsive Placement (Rekomendasi Utama)**
- **Mobile**: Popover menggunakan `right-0 w-[calc(100vw-2rem)] max-w-sm` agar selalu berjarak minimal 16px dari tepi kiri & kanan layar HP.
- **Desktop (SideNav)**: Popover pada desktop melayang ke arah kanan sidebar (`left-full top-0 ml-3 w-80 sm:w-96`) masuk ke area konten utama, tanpa memotong sidebar atau terdorong ke luar layar.
- **Kelebihan**: Tampilan di HP dan Desktop menjadi 100% presisi dan tidak pernah terpotong di perangkat mana pun.

### **Opsi 2: Fixed Top-Right Global Header Bar di Desktop & Mobile**
- **Deskripsi**: Memindahkan ikon notifikasi lonceng ke Top Bar global seragam di seluruh halaman (baik desktop maupun mobile) di sudut kanan atas layar (`fixed top-4 right-6`).
- **Kelebihan**: Posisi lonceng notifikasi konsisten di pojok kanan atas untuk semua resolusi.

### **Opsi 3: Center-Screen Modal Popover pada Mobile Device**
- **Deskripsi**: Pada tampilan mobile, notifikasi dibuka sebagai dialog modal di tengah layar, sedangkan pada desktop menggunakan popover flyout.

---

## 3. Cara Pengujian Notifikasi (Notification Testing Guide)

Dua jenis notifikasi aktif dalam sistem:

### A. Pengujian Notifikasi Kamar Perbaikan (`MAINTENANCE`):
1. Buka halaman **Manajemen Kamar** (`/kamar`).
2. Pilih salah satu kamar (contoh: Kamar 04 atau Kamar 10).
3. Ubah status kamar menjadi **"Perbaikan"** (`MAINTENANCE`).
4. Ikon lonceng notifikasi di pojok kanan atas akan langsung memunculkan **badge indikator merah** (+1).
5. Klik ikon lonceng untuk melihat rincian laporan kamar perbaikan dan tombol pintas detailnya.

### B. Pengujian Notifikasi Tagihan Jatuh Tempo (`EXPIRING_SOON`):
1. Buka halaman **Daftar Penghuni** (`/penghuni`).
2. Tambahkan atau edit penghuni baru dengan rentang tanggal jatuh tempo H-3 atau ubah status tenant menjadi **"Akan Jatuh Tempo"**.
3. Ikon lonceng akan langsung bertambah angkanya dan menampilkan nama penghuni beserta tombol **WhatsApp "Ingatkan"**.

### C. Pengujian Pengisian Data Uji Otomatis (Demo Test Notification Button):
- Menambahkan tombol pengujian sementara di halaman/popover untuk mengaktifkan 1 tenant jatuh tempo & 1 kamar perbaikan secara instan untuk pengujian QA.
