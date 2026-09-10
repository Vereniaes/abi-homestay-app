# Status Kamar & Trend Okupansi Dinamis

## Masalah Sebelumnya
1. **Fallback Falsy pada Nilai 0**:
   Pada `app/actions.ts`, terdapat kode `maintenanceCount: maintenanceCount || 4`. Karena di MongoDB jumlah kamar perbaikan adalah 0 (falsy), kode tersebut memaksa angka `4`, sehingga total kamar terkesan 33 + 25 + 4 = 62 kamar (padahal total fisik kamar adalah 58).
2. **Trend Okupansi 5 Bulan Terakhir Statis**:
   Grafik batang di Beranda sebelumnya menampilkan bulan statis (`Jan, Feb, Mar, Apr, Mei`) dengan tinggi persentase hardcoded di JSX tanpa sinkronisasi dengan data sewa dan transaksi riil.

## Solusi yang Diimplementasikan
1. **Perhitungan Real-Time Murni Database (`app/actions.ts`)**:
   - `totalRooms`: 58
   - `occupiedCount`: 33 (57%)
   - `availableCount`: 25 (43%)
   - `maintenanceCount`: 0 (0%) -> Nilai `0` dipertahankan murni tanpa fallback palsu.
   - `occupancyRate`: 57%
2. **Kalkulasi Rolling 5 Bulan Dinamis**:
   - Menghitung 5 bulan terakhir secara bergulir berdasarkan bulan berjalan (`now.getMonth()`), menghasilkan label kalender dinamis (misal: Mei, Jun, Jul, Agu, Sep 2026).
   - Memetakan tingkat sewa aktif dan transaksi pemasukan per bulan.
3. **Penyempurnaan Visual & Interaktivitas UI (`components/HomeDashboardClient.tsx`)**:
   - Donut Chart dengan SVG stroke presisi, transisi warna dinamis, dan teks persentase beranimasi di tengah.
   - Legend bar responsif dengan badge persentase (Terisi 33 [57%], Kosong 25 [43%], Perbaikan 0 [0%]).
   - Mini Bar Chart dengan label persentase di atas setiap bar, efek hover tooltip detail kamar (`September 2026: 57% (33/58 kamar)`), dan highlighting khusus pada bulan berjalan dengan gradasi teal aktif.
