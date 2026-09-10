# Penanganan Sisa Cache Klien Saat Logout dan Login (Role Stale Issue)

## Masalah yang Ditemukan
Saat pengguna logout dari akun dengan role `VIEW` lalu masuk kembali menggunakan akun `ADMIN`, tampilan antarmuka (UI) tetap memperlakukan pengguna sebagai `VIEW` (menu Admin tidak muncul dan fitur operasional tetap tersembunyi) sampai halaman dimuat ulang secara paksa (*hard refresh*).

## Akar Masalah
- Navigasi internal Next.js (SPA client-side navigation) mempertahankan objek `memoryCache` di memori browser ([lib/client-cache.ts](file:///home/vereniaes/project/abi-homestay-app/lib/client-cache.ts)).
- Komponen [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) dan [Pengaturan](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx) sebelumnya hanya memanggil `logoutUser()` lalu `router.push('/login')` tanpa memanggil `clearClientCache()`.
- Saat pengguna login kembali di [app/login/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/login/page.tsx), `clearClientCache()` juga tidak dipanggil.
- Akibatnya, `getClientCache("currentUser")` pada sesi berikutnya tetap membaca data profil sesi sebelumnya (`role: "VIEW"`).

## Solusi yang Diterapkan
1. **Pembersihan Cache Klien Global (`clearClientCache()`)**:
   - Dipanggil di `handleLogout` pada [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) dan [app/pengaturan/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/pengaturan/page.tsx).
   - Dipanggil di `handleSubmit` pada [app/login/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/login/page.tsx) saat otentikasi login berhasil.
2. **Full Window Redirect (`window.location.href`)**:
   - Menggantikan `router.push` saat logout (`window.location.href = "/login"`) dan saat login berhasil (`window.location.href = "/"`).
   - Memastikan seluruh ekosistem JavaScript, React lifecycle, dan in-memory cache di browser dibersihkan 100% sehingga sesi baru langsung memuat state yang segar dari server.
