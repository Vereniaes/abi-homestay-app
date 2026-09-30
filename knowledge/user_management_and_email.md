# Manajemen Pengguna & Dukungan Email Pengelola

## 1. Ringkasan Fitur
Implementasi penambahan atribut email pada model pengguna (`User`) serta integrasi alur kerja manajemen pengguna dari halaman Pengaturan (`/pengaturan`) ke halaman Manajemen User (`/users`).

## 2. Struktur Data & Skema
Pada `prisma/schema.prisma`:
- Model `User` ditambahkan field opsional `email String?`.
- Database disinkronkan melalui `npx prisma db push`.
- Prisma client digenerate ulang via `npx prisma generate`.

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  name      String
  email     String?
  password  String
  role      UserRole @default(VIEW)
  status    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 3. Server Actions (`app/actions.ts`)
1. **`getUsers()`**:
   - Menambahkan pemilihan kolom `email: true` pada query `prisma.user.findMany`.
2. **`createUser(formData)`**:
   - Membaca input `email` dari FormData dan menyimpan nilai `email: email || null`.
   - Menginvalidasi path `/users` dan `/pengaturan`.
3. **`updateUser(formData)`**:
   - Menerima dan memperbarui field `email` ke database.
   - Menginvalidasi path `/users` dan `/pengaturan`.
4. **`loginUser(formData)`**:
   - Menyimpan `email` pengguna ke dalam sesi cookie enkripsi/JSON `abi_session`.

## 4. Antarmuka Pengguna (UI)
1. **Halaman `/users`**:
   - Menambahkan kolom **Email** pada tabel desktop.
   - Menampilkan icon dan alamat email pada kartu mobile di bawah username.
   - Filter pencarian (`filteredUsers`) mendukung pencarian berdasarkan nama, username, maupun email.
   - Modal form tambah/edit user dilengkapi input field `Email Pengguna (opsional)`.
2. **Halaman `/pengaturan`**:
   - Pada profil akun pengguna, ditampilkan email pengguna jika tersedia.
   - Pada grup **Tampilan & Sistem**, ditambahkan tombol navigasi **Manajemen Pengguna** dengan ikon `manage_accounts`, mengarahkan pengelola/admin langsung ke `/users`.

## 5. Validasi
- `npx prisma generate && npx tsc --noEmit`: Sukses (0 error).
- `npm run build`: Sukses (semua route statis dan dinamis ter-compile tanpa kendala).
