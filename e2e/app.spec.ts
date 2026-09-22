import { test, expect } from '@playwright/test';

test.describe('Abi Homestay - Automation Test Suite', () => {

  // Test 1: Flow Autentikasi / Login
  test('1. Autentikasi: Halaman Login & Validasi Login Admin', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Abi Homestay/i);

    // Form input login
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Lakukan login dengan kredensial admin
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    await submitButton.click();

    // Harus berhasil login dan masuk ke Dashboard (URL '/')
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  // Untuk pengujian modul-modul lainnya, kita pasang cookie sesi admin
  test.describe('Modul Utama (Dengan Sesi Admin Terautentikasi)', () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: 'abi_session',
          value: JSON.stringify({
            id: 'admin_test_session',
            username: 'admin',
            name: 'System Administrator',
            role: 'ADMIN',
          }),
          domain: 'localhost',
          path: '/',
          httpOnly: true,
        },
      ]);
    });

    test('2. Dashboard: Menampilkan Ringkasan Okupansi, Statistik & Navigasi', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Abi Homestay/i);
      await expect(page.locator('body')).toBeVisible();

      // Periksa statistik kamar
      await expect(page.getByText(/Total Kamar|Okupansi|Kamar Terisi/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('3. Modul Kamar: Menampilkan Grid Kamar, Filter & Pencarian Kamar', async ({ page }) => {
      await page.goto('/kamar');
      await expect(page).toHaveTitle(/Abi Homestay/i);

      // Periksa Search Input Kamar
      const searchRoomInput = page.getByPlaceholder(/Cari No. Kamar/i);
      await expect(searchRoomInput).toBeVisible({ timeout: 10000 });

      // Lakukan pencarian kamar 35
      await searchRoomInput.fill('35');
      await expect(searchRoomInput).toHaveValue('35');
      await searchRoomInput.clear();
    });

    test('4. Modul Penghuni: Menampilkan Daftar Penghuni, Search & Filter Status', async ({ page }) => {
      await page.goto('/penghuni');
      await expect(page).toHaveTitle(/Abi Homestay/i);

      // Search bar penghuni
      const searchTenantInput = page.getByPlaceholder(/Cari nama atau nomor kamar/i);
      await expect(searchTenantInput).toBeVisible({ timeout: 10000 });

      // Lakukan pencarian penghuni
      await searchTenantInput.fill('35');
      await expect(searchTenantInput).toHaveValue('35');
      await searchTenantInput.clear();

      // Tab filter status penghuni
      const filterSemua = page.getByRole('button', { name: /^Semua$/i }).first();
      await expect(filterSemua).toBeVisible();
    });

    test('5. Modul Laporan Keuangan: Search Bar & Filter Chip (Semua, Pemasukan, Pengeluaran)', async ({ page }) => {
      await page.goto('/laporan');
      await expect(page).toHaveTitle(/Abi Homestay/i);

      // Periksa heading Riwayat Transaksi
      await expect(page.getByText(/Riwayat Transaksi/i)).toBeVisible({ timeout: 10000 });

      // Periksa Search Input
      const searchInput = page.getByPlaceholder(/Cari nama penghuni/i);
      await expect(searchInput).toBeVisible();

      // Periksa Tombol Filter
      const filterSemua = page.getByRole('button', { name: /Semua/i });
      const filterPemasukan = page.getByRole('button', { name: /Pemasukan/i });
      const filterPengeluaran = page.getByRole('button', { name: /Pengeluaran/i });

      await expect(filterSemua).toBeVisible();
      await expect(filterPemasukan).toBeVisible();
      await expect(filterPengeluaran).toBeVisible();

      // Interaksi Klik Filter Pemasukan & Pengeluaran
      await filterPemasukan.click();
      await filterPengeluaran.click();
      await filterSemua.click();

      // Interaksi Cari Kamar
      await searchInput.fill('35');
      await expect(searchInput).toHaveValue('35');
      await searchInput.clear();
    });

    test('6. Modul Pengaturan: Memuat Halaman Pengaturan Sistem & Informasi Akun', async ({ page }) => {
      await page.goto('/pengaturan');
      await expect(page).toHaveTitle(/Abi Homestay/i);
      await expect(page.locator('body')).toBeVisible();
    });
  });

});
