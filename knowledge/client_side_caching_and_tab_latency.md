# Knowledge: Analisis Penyebab Lambat Navigasi Antar Halaman & Arsitektur Caching

## 1. Mengapa Halaman Masih Terasa Berat dan Lambat? (Root Cause Analysis)

### A. Ketiadaan Cache Sisi Klien (Client-Side Cache: 0%)
Setiap kali pengguna berpindah tab (misalnya dari Beranda ke Kamar, lalu ke Laporan, lalu kembali ke Kamar):
1. **Siklus Unmount & Pembersihan Memori**:
   Komponen halaman adalah Client Component (`"use client"`). Begitu pengguna berpindah rute, state React (`const [rooms, setRooms] = useState([])`) langsung dibuang dari memori (*garbage collected*).
2. **Refetch Berulang dari Nol**:
   Saat tab Kamar dibuka kembali, state `rooms` mulai dari array kosong `[]`. Halaman merender grid kosong, lalu memicu `useEffect`, lalu mengirim request HTTP Server Action ke server, lalu server query ke MongoDB Atlas.
3. **Waktu Tunggu Terasa Seperti Membuka Web Baru**:
   Pengguna harus menunggu 200ms - 500ms setiap kali mengklik menu tab, padahal data kamar atau laporan tidak berubah dalam 10 detik terakhir.

### B. Spamming Request pada `components/Navigation.tsx`
Di [components/Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx#L41-L64):
```tsx
useEffect(() => {
  getCurrentUser();
  getNotificationAlerts();
}, [pathname]);
```
- Dependency array menggunakan `[pathname]`.
- Setiap kali pengguna mengklik tab apa pun, `Navigation` menembakkan **2 Server Action sekaligus** (`getCurrentUser` dan `getNotificationAlerts`).
- Bersamaan dengan itu, halaman tujuan juga menembakkan Server Action-nya sendiri (`getRooms` atau `getTransactions`).
- Akibatnya, setiap klik menu memicu **3 hingga 4 request paralel ke database**, menyebabkan antrean koneksi di jaringan seluler/browser mobile (*network contention*).

### C. Bypass Cache Server pada Beranda (`app/page.tsx`)
Di [app/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/page.tsx#L4):
```tsx
export const revalidate = 0;
```
- Ini mematikan cache server Next.js sepenuhnya, memaksa query database 754ms dihitung ulang setiap kali beranda dibuka.

---

## 2. Arsitektur Solusi: Stale-While-Revalidate (SWR) Client Cache

Solusi paling elegan dan berukuran ringan (0 byte external dependency) adalah membuat modul **In-Memory Stale-While-Revalidate Cache** di `lib/client-cache.ts`:

1. **Instan Saat Klik (0 ms Render)**:
   Saat pengguna mengklik tab Kamar:
   - Komponen langsung membaca `getClientCache("rooms")`.
   - 58 kamar langsung dirender pada frame pertama (0ms). Tidak ada jeda kosong, tidak ada skeleton yang berlama-lama.
2. **Revalidasi Latar Belakang (Silent Background Refresh)**:
   - Jika cache sudah lebih tua dari durasi TTL (misal 30–60 detik), sistem mengambil data baru di latar belakang tanpa membuat layar berkedip atau kosong.
   - Jika ada perubahan data, state diperbarui dengan mulus.
3. **Mutasi Langsung (Cache Mutation)**:
   - Saat pengguna mengubah status kamar (`updateRoomInventory`) atau menambah transaksi (`addTransaction`), data cache lokal langsung diperbarui (*optimistic/immediate update*).
4. **Optimasi Navigation**:
   - `currentUser` disimpan di cache sesi sehingga hanya diambil 1 kali saat aplikasi pertama dibuka.
   - `alerts` disimpan dengan TTL 60 detik sehingga tidak menembak server di setiap klik menu.
