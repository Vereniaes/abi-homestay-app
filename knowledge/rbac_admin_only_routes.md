# Knowledge: Pembatasan Hak Akses (RBAC) Menu Laporan & Manajemen Sistem Khusus Admin

## 1. Analisis Kebutuhan & Temuan Kritis
Pengguna meminta: "menu manajemen sistem sama laposan [laporan] cuman bisa diliat role admin".

### Temuan Kritis (Critical Issues):
1. **Penyaringan Menu Navigasi (UI Layer)**:
   - Saat ini di [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx), menu `navItems` (`Beranda`, `Kamar`, `Penghuni`, `Laporan`, `Pengaturan`) ditampilkan ke semua pengguna, baik di Desktop SideNav maupun Mobile BottomNavBar.
   - Menu `Laporan` dan `Pengaturan` harus difilter secara dinamis sehingga hanya muncul jika `currentUser?.role === "ADMIN"`.
2. **Proteksi Akses Rute Langsung (Middleware Guard Layer)**:
   - Pengguna non-admin (role `EDIT` atau `VIEW`) saat ini masih bisa mengakses `/laporan` atau `/pengaturan` secara manual melalui URL browser.
   - [middleware.ts](file:///home/vereniaes/project/abi-homestay-app/middleware.ts) harus memeriksa payload `role` dari cookie `abi_session`. Jika role bukan `ADMIN` dan mencoba mengakses rute terproteksi (`/laporan`, `/pengaturan`, `/users`), harus langsung di-redirect ke `/`.
3. **Konflik Alur Logout Pengguna Non-Admin**:
   - Berdasarkan arsitektur sebelumnya, tombol Logout dipindahkan ke dalam halaman `/pengaturan`.
   - Jika halaman `/pengaturan` dikunci total 100% dari pengguna `EDIT` dan `VIEW`, mereka kehilangan akses untuk Logout dari akun mereka.
   - **Solusi UX**:
     - Opsi A: Menampilkan tombol Logout cepat di profile card SideNav (Desktop) dan TopAppBar (Mobile) khusus untuk non-admin.
     - Opsi B: Halaman `/pengaturan` tetap dapat diakses, namun konten "Operasional (Master Harga)" dan "Sistem" disembunyikan/dikunci, menyisakan Profil & Logout.
     - Opsi C: Menu sidebar dinamai "Manajemen Sistem" (`/pengaturan` & `/users`), dan tombol logout diletakkan universal di profile box bawah sidebar.

---

## 2. 3 Opsi Solusi Desain RBAC

### Opsi 1: Strict Multi-Layer Guarding + Quick Logout Button (Rekomendasi Utama)
- **Mekanisme**:
  - Menu `Laporan` dan `Pengaturan` sepenuhnya disembunyikan dari SideNav dan BottomNav jika role bukan `ADMIN`.
  - `middleware.ts` memblokir akses URL langsung `/laporan`, `/pengaturan`, dan `/users` untuk non-admin dan mengalihkannya ke `/`.
  - Menambahkan tombol Logout kecil yang elegan di samping nama user pada kotak profil SideNav (desktop) dan TopBar (mobile) agar pengguna `EDIT` dan `VIEW` tetap bisa keluar akun dengan mudah.
- **Kelebihan**: Keamanan berlapis dan paling rapi secara antarmuka.

### Opsi 2: Halaman Pengaturan Parsial (Non-Admin View)
- **Mekanisme**:
  - Menu `Laporan` disembunyikan sepenuhnya dari non-admin.
  - Menu `Pengaturan` tetap terlihat untuk non-admin, tetapi di dalamnya hanya menampilkan info profil dan tombol Logout (seluruh konfigurasi harga, sistem, dan WhatsApp disembunyikan).
- **Kelebihan**: Alur logout tetap berada di Pengaturan seperti sebelumnya.

### Opsi 3: Client-Side Redirect Only
- **Mekanisme**:
  - Hanya menyembunyikan menu di `Navigation.tsx` tanpa proteksi di `middleware.ts`.
- **Kekurangan**: Tidak aman karena URL tetap bisa ditembus.
