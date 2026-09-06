# Knowledge: Proteksi Rute & Redireksi Halaman Login saat Pertama Kali Web Diakses

## 1. Analisis Permasalahan (Critical Issue Analysis)
Pengguna menginginkan halaman login (`/login`) langsung muncul ketika web pertama kali diakses.

### Temuan Kode Saat Ini:
1. **Tidak Ada Next.js Middleware (`middleware.ts`)**: Aplikasi saat ini belum memiliki file `middleware.ts` di tingkat akar project Next.js.
2. **Halaman Utama (`app/page.tsx`) Bebas Akses**: Komponen `HomePage` langsung me-render `HomeDashboardClient` tanpa memeriksa keberadaan cookie sesi `abi_session`.
3. **Pengunjung Unauthenticated Bisa Melihat Dashboard**: Seseorang yang membuka `http://localhost:3000/` tanpa login dapat melihat data dashboard, daftar kamar, dan penghuni secara penuh (meskipun Server Actions untuk mutasi data sudah di-guard oleh check role `VIEW`).

---

## 2. 3 Opsi Solusi yang Dapat Diterapkan (3 Options with Reasoning)

### **Opsi 1: Next.js Middleware Protection (Rekomendasi Utama - Standard & Robust)**
- **Deskripsi**: Membuat file `middleware.ts` di akar project Next.js yang mengecek cookie `abi_session` pada setiap request rute (`/`, `/kamar`, `/penghuni`, `/laporan`, `/pengaturan`, `/users`).
- **Aturan Alur Navigasi**:
  - Jika pengguna **belum login** (tidak ada cookie `abi_session`) dan mencoba mengakses rute apapun selain `/login`: **Redireksi otomatis ke `/login`**.
  - Jika pengguna **sudah login** (cookie `abi_session` ada) dan mencoba mengakses `/login`: **Redireksi otomatis ke `/` (Beranda)**.
- **Kelebihan**: Proteksi tingkat server (SSR/Edge Level) sebelum komponen diproses, tanpa *flicker* UI, paling aman dan sesuai best practice Next.js App Router.
- **Kekurangan**: Membutuhkan pembuatan file `middleware.ts` baru.

### **Opsi 2: Server Component Guard pada Root & Protected Layout/Pages**
- **Deskripsi**: Menambahkan pengecekan `getCurrentUser()` dan fungsi `redirect('/login')` dari `next/navigation` langsung di `app/page.tsx` serta page server components lainnya (atau di layout server component).
- **Kelebihan**: Tidak memerlukan middleware terpisah.
- **Kekurangan**: Perlu menambahkan kode `getCurrentUser()` dan check `redirect` pada setiap file `page.tsx` atau layout yang ingin diproteksi.

### **Opsi 3: Client-side Session Check pada AppLayoutWrapper**
- **Deskripsi**: Menambahkan logika di `AppLayoutWrapper.tsx` (Client Component) untuk memeriksa sesi via API/Server Action saat mount. Jika belum login dan posisi rute bukan `/login`, lakukan `router.push('/login')`.
- **Kelebihan**: Pengubahan terbatas pada satu file wrapper UI client.
- **Kekurangan**: Terjadi *layout flicker* (UI dashboard terlihat sekilas sebelum halaman berpindah ke `/login`), kurang aman secara SSR.

---

## 3. Analisis Dampak Terhadap Kode Lain (Impact Analysis)
- **Komponen Terdampak Langsung**:
  - [middleware.ts](file:///home/vereniaes/project/abi-homestay-app/middleware.ts) (Baru/NEW) atau [app/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/page.tsx) / [components/AppLayoutWrapper.tsx](file:///home/vereniaes/project/abi-homestay-app/components/AppLayoutWrapper.tsx).
- **Dampak pada Fitur Lain**:
  - **Proses Login & Logout**: Fungsi `loginUser` dan `logoutUser` di `app/actions.ts` sudah menyetel/menghapus cookie `abi_session`, sehingga akan bekerja secara harmonis dengan middleware.
  - **Asset & API Route**: Perlu pengecekan matcher di `middleware.ts` agar tidak memblokir static assets (`_next`, `favicon.ico`, `public`, gambar).

---

## 4. Komentar & Konvensi Kode (Formatting Guideline)
Setiap helper/fungsi baru yang ditulis wajib mengikuti standar proyek:
- Bahasa formal (tanpa informal/slang).
- Penggunaan komentar terstruktur:
  ```ts
  // helper --------------------------------------------------------------------------
  // function middleware untuk proteksi rute & redireksi autentikasi
  // input param : request (NextRequest)
  // output : NextResponse (redirect atau continue)
  // end of helper ------------------------------------------------------------------
  ```
