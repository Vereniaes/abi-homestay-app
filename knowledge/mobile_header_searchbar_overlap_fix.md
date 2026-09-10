# Knowledge: Analisis Penyebab Header Menutupi Searchbar & Solusi Tata Letak Mobile

## 1. Analisis Akar Masalah (Root Cause)

Berdasarkan tangkapan layar pengguna dan inspeksi kode:
1. **Kompresi Horizontal Header di Layar Ponsel**:
   - Komponen TopAppBar di [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx#L293) memiliki padding horizontal `px-md` (24px kiri & kanan).
   - Di sisi kanan, terdapat badge user: `currentUser.name` ("System Administrator") + badge role ("ADMIN") + tombol lonceng notifikasi yang memakan ruang horizontal sebesar ~210px.
   - Pada layar smartphone (lebar 360px - 390px), sisa ruang untuk teks judul di sisi kiri hanya tersisa ~80px - 100px.
2. **Judul Terpecah Menjadi 2 Baris**:
   - Teks "Manajemen Kamar" tidak muat di ruang 90px sehingga terpecah menjadi 2 baris ("Manajemen" di baris 1, "Kamar" di baris 2), ditambah baris tanggal "Kamis, 10 September 2026".
   - Tinggi total header melonjak dari estimasi awal 64px menjadi **~104px - 110px**.
3. **Top Padding Main Content Terlalu Sempit (`pt-20`)**:
   - Di seluruh halaman ([app/kamar/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx#L133), [app/penghuni/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx#L127), dll.), elemen `<main>` menggunakan `pt-20` (80px).
   - Karena tinggi header adalah ~104px sedangkan batas atas konten mulai dari 80px, maka **24px bagian atas searchbar tertutup persis di bawah background header**.

---

## 2. Pilihan Pendekatan Solusi

### Opsi 1: Two-Way Protection (Header Ringkas + Safe Padding `pt-28`) - Direkomendasikan
1. Di [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx):
   - Tambahkan `max-w-[85px] sm:max-w-[120px] truncate` pada nama user di header mobile agar nama panjang tidak mendesak judul ke 2 baris.
   - Ubah padding horizontal header mobile menjadi `px-4 py-2.5` agar lebih kompak.
2. Di seluruh halaman ([kamar](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx), [penghuni](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx), [laporan](file:///home/vereniaes/project/abi-homestay-app/app/laporan/page.tsx), [pengaturan](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx), [users](file:///home/vereniaes/project/abi-homestay-app/app/users/page.tsx), [HomeDashboardClient](file:///home/vereniaes/project/abi-homestay-app/components/HomeDashboardClient.tsx)):
   - Ubah top padding dari `pt-20` (80px) menjadi **`pt-28 md:pt-8` (112px)**.
   - Searchbar dijamin 100% bebas dari tumpang tindih bahkan jika judul terbungkus di layar paling sempit sekalipun.

### Opsi 2: Sticky Header Tanpa Padding Manual
- Ubah header dari `fixed` menjadi `sticky top-0`.
- Hapus semua `pt-20` pada konten agar alur dokumen HTML otomatis menempatkan searchbar di bawah header.

### Opsi 3: Sembunyikan Nama User di Mobile (Hanya Tampilkan Badge Role)
- Di mobile, sembunyikan teks "System Administrator" dan hanya tampilkan badge `[ADMIN]` dan lonceng.
- Judul tetap 1 baris, tinggi header terkunci di 60px.
