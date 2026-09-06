# Knowledge: Pengembangan & Aktivasi Fitur Notifikasi Pojok Kanan Atas

## 1. Analisis Permasalahan (Critical Issue Analysis)
Pengguna meminta ikon/tombol notifikasi di pojok kanan atas diaktifkan ("notifikasi di pjok kanan atas di bikin aktif").

### Temuan Kode saat Ini:
1. **Header TopAppBar saat ini (`Navigation.tsx`)**: Menampilkan nama user, role badge, dan tombol logout di pojok kanan atas untuk tampilan mobile/tablet, namun belum memiliki ikon lonceng notifikasi (bell icon) yang interaktif.
2. **SideNav Desktop (`Navigation.tsx`)**: Belum menyertakan ikon lonceng notifikasi cepat di bagian header navigasi.
3. **Data Sumber Notifikasi Sudah Ada di Backend (`actions.ts`)**: Server action `getDashboardStats()` sudah menghitung data penghuni jatuh tempo (`dueTenants`) dan kamar dalam perbaikan (`maintenanceRoomsList`). Data ini siap dikonsumsi oleh komponen notifikasi.

---

## 2. 3 Opsi Solusi yang Dapat Diterapkan (3 Options with Reasoning)

### **Opsi 1: Interactive Popover Dropdown di TopAppBar (Rekomendasi Utama)**
- **Deskripsi**: Menambahkan tombol lonceng dengan *red pulse dot indicator* (badge angka jika ada notifikasi aktif) di pojok kanan atas. Ketika diklik, akan membuka Popover Dropdown halus yang berisi daftar:
  - Tenant yang akan jatuh tempo (`EXPIRING_SOON`) beserta tombol aksi WhatsApp "Ingatkan".
  - Kamar dalam perbaikan (`MAINTENANCE`) beserta tautan ke detail modul Kamar.
- **Kelebihan**: Pengalaman pengguna sangat responsif, cepat, intuitif, dan sesuai desain mockup `index.html`.
- **Kekurangan**: Membutuhkan pembuatan state popover dropdown dan data fetching notifikasi di `Navigation.tsx`.

### **Opsi 2: Notification Drawer / Side Sheet Modal**
- **Deskripsi**: Ketika ikon lonceng diklik, sebuah panel drawer akan meluncur (slide-in) dari sisi kanan layar menampilkan detail lengkap seluruh riwayat notifikasi operasional.
- **Kelebihan**: Cocok jika di masa depan terdapat banyak jenis notifikasi audit trail.
- **Kekurangan**: Membutuhkan komponen modal/drawer terpisah yang lebih kompleks.

### **Opsi 3: Quick Badge Count with Direct Navigation**
- **Deskripsi**: Menampilkan ikon lonceng dengan angka notifikasi aktif. Jika diklik, pengguna langsung diarahkan (scroll/navigate) ke seksyen "Jatuh Tempo & Perhatian" pada Beranda (`/`).
- **Kelebihan**: Sederhana dan tanpa popup UI baru.
- **Kekurangan**: Kurang interaktif jika pengguna sedang berada di halaman modul lain (`/kamar`, `/penghuni`).

---

## 3. Analisis Dampak Terhadap Kode Lain (Impact Analysis)
- **Komponen Terdampak Langsung**:
  - [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) -> Penambahan ikon `notifications`, state `isNotificationOpen`, dan popover menu notifikasi.
  - [app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts) -> Penambahan helper server action `getNotificationAlerts()` jika diperlukan pemisahan data ringkas.
- **Dampak pada Fitur Lain**: 0% potensi *breakage*. Tidak mengubah skema DB Prisma maupun logika autentikasi.

---

## 4. Format Komentar Kode (Standard Guideline)
```ts
// helper --------------------------------------------------------------------------
// function untuk memuat daftar notifikasi aktif (penghuni jatuh tempo & kamar perbaikan)
// input param : none
// output : array of NotificationAlert
// end of helper ------------------------------------------------------------------
```
