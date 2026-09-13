# Knowledge: Analisis Masalah Dark Mode dan Arsitektur Global Theme Engine

## 1. Analisis Kritis Masalah
Pengguna melaporkan: *"dark modenya kurang bener, banyak field yang masih terang"*.

### Akar Penyebab Teknis:
1. **Token Warna Tailwind Bersifat Statis**:
   Di `tailwind.config.ts`, token warna Material 3 didefinisikan sebagai string heksadesimal statis tanpa varian gelap:
   - `surface-container-lowest: "#ffffff"` (Latar kartu dan modal)
   - `surface: "#f7f9fb"` (Latar field input)
   - `background: "#f7f9fb"` (Latar utama aplikasi)
   - `primary-container: "#131b2e"` (Warna teks utama)
   - `on-surface-variant: "#45464d"` (Warna label input)
2. **Ketiadaan Aturan Gelap di CSS Global**:
   Di [app/globals.css](file:///home/vereniaes/project/abi-homestay-app/app/globals.css), elemen `body` dipatok pada `background-color: #F8FAFC` dan `color: #191c1e`. Tidak ada aturan selektor `html.dark` yang menimpa warna dasar tersebut.
3. **Komponen Form & Navigasi**:
   Seluruh tag `<input>`, modal popup (Master Harga Sewa, Tambah Transaksi, Detail Kamar), TopAppBar, dan BottomNavBar menggunakan kelas statis (`bg-white`, `bg-[#F8FAFC]/98`, `bg-surface-container-lowest`), sehingga saat class `.dark` disematkan pada tag `<html>`, seluruh bidang tersebut tetap berwarna putih/terang.

---

## 2. 3 Opsi Solusi

### Opsi 1: Global Semantic Theme Engine di `app/globals.css` (Rekomendasi Utama)
- **Mekanisme**:
  Menambahkan aturan selektor turunan `html.dark` pada [app/globals.css](file:///home/vereniaes/project/abi-homestay-app/app/globals.css) yang secara semantis menargetkan:
  - `html.dark body`: latar `#0B0F19` (Slate 950), teks `#F8FAFC`.
  - `html.dark .bg-surface-container-lowest`, `html.dark .bg-white`: `#111827` (Slate 900) dengan border `#1F2937`.
  - `html.dark .bg-surface`, `html.dark input`, `html.dark select`, `html.dark textarea`: `#1F2937` (Slate 800), border `#374151`, teks `#F8FAFC`.
  - `html.dark header`, `html.dark nav`, `html.dark aside`: `#0B0F19` / `#111827` dengan blur dan border gelap.
  - `html.dark .text-primary`, `html.dark .text-primary-container`, `html.dark .text-on-surface`: `#F8FAFC`.
  - `html.dark .text-on-surface-variant`: `#94A3B8`.
- **Kelebihan**:
  - *Write less code, high reasoning*: Hanya mengedit 1 berkas CSS tanpa perlu mengubah puluhan berkas TSX.
  - Menghilangkan 100% bidang putih/terang di seluruh halaman dan modal secara instan.
  - Risiko regresi logika bisnis 0%.

### Opsi 2: Migrasi Token Warna `tailwind.config.ts` ke CSS Custom Properties
- **Mekanisme**:
  Mengubah seluruh nilai warna di `tailwind.config.ts` menjadi `var(--color-...)` dan mendefinisikan variabel CSS untuk `:root` dan `.dark`.
- **Kelemahan**:
  Beresiko tinggi memicu inkonsistensi utilitas warna Tailwind v4 dan membutuhkan refaktor ekstensif pada konfigurasi build.

### Opsi 3: Pengubahan Manual Utility Class `dark:` pada Setiap Komponen TSX
- **Mekanisme**:
  Menambahkan ratusan utilitas `dark:bg-... dark:text-...` pada setiap file halaman dan komponen.
- **Kelemahan**:
  Menghasilkan *bloated code*, rawan ada komponen/modal yang terlewat, dan menyulitkan pemeliharaan kode di masa depan.
