# Knowledge: Penegakan Hak Akses Murni Baca (Read-Only) untuk Role VIEW

## 1. Analisis Masalah Kritis
Pengguna meminta: "viiew hanya view aja, tombol ini hilangin, karena tujuannya view doang kan, gk bisa edit gak bisa ngetik".

### Screenshot yang Dikirimkan:
1. **Tombol "Hubungi via WhatsApp"** pada detail penghuni.
2. **Tombol "Edit / Perpanjang Masa Sewa" dan "Hapus Penghuni"** pada modal profil detail penghuni.
3. **Tombol "Export / Import Excel" dan Floating Action Button (+)** pada halaman daftar penghuni.
4. **Tombol "Simpan Perubahan" dan Toggle "Baik / Perbaikan"** pada modal detail kamar dan inventaris.

### Temuan Arsitektur:
- Di sisi server ([app/actions.ts](file:///home/vereniaes/project/abi-homestay-app/app/actions.ts)), proteksi backend sudah aktif dan memblokir mutasi jika `user.role === "VIEW"`.
- Namun di sisi antarmuka ([app/penghuni/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/penghuni/page.tsx) dan [app/kamar/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/kamar/page.tsx)), komponen belum membaca `currentUser.role` dari cache atau server. Akibatnya, seluruh tombol interaksi input/mutasi tetap tampil di layar akun `VIEW`.

---

## 2. Peta Elemen yang Dibatasi untuk Role VIEW

### A. Modul Penghuni (`app/penghuni/page.tsx`):
1. **Modal Profil Penghuni**:
   - Sembunyikan tombol **"Edit / Perpanjang Masa Sewa"**.
   - Sembunyikan tombol **"Hapus Penghuni"**.
   - Sembunyikan/pertahankan tombol **"Hubungi via WhatsApp"** (opsional / dikonfirmasi via grill-me).
2. **Daftar Penghuni**:
   - Sembunyikan Floating Action Button **"+" (Tambah Penghuni)**.
   - Sembunyikan tombol atau bagian tab **"Import Excel"** (hanya izinkan Export Excel atau sembunyikan seluruh tombol).

### B. Modul Kamar (`app/kamar/page.tsx`):
1. **Modal Inventaris Kamar**:
   - Sembunyikan tombol **"Simpan Perubahan"**.
   - Non-aktifkan toggle **"Baik / Perbaikan"** (tampil sebagai badge status read-only statis).

---

## 3. 3 Opsi Solusi Desain RBAC Frontend

### Opsi 1: Strict Pure Read-Only View (Rekomendasi Utama)
- **Mekanisme**:
  - Untuk role `VIEW`, hilangkan seluruh tombol mutasi data (Tambah, Edit, Hapus, Simpan, dan Import Excel).
  - Tampilan inventaris kamar menjadi indikator badge status murni tanpa tombol klik.
  - Tombol WhatsApp pada penghuni dapat disembunyikan atau diubah menjadi info teks nomor biasa.
- **Kelebihan**: 100% selaras dengan prinsip "view doang, tidak bisa edit, tidak bisa ngetik".

### Opsi 2: Read-Only dengan Akses Hubungi & Export
- **Mekanisme**:
  - Menghilangkan Edit, Hapus, Tambah, dan Simpan Perubahan.
  - Mempertahankan tombol Hubungi WhatsApp dan Export Excel (download report) karena tidak memanipulasi database.

### Opsi 3: Disabled State (Tombol Tetap Ada namun Berstatus Disabled & Abu-abu)
- **Kekurangan**: Tampilan kurang bersih dan membingungkan pengguna jika tombol tetap terlihat namun tidak dapat diklik.
