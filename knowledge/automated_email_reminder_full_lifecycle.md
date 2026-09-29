# Knowledge: Siklus Lengkap Pengingat Email Pembayaran ABI Homestay via Brevo API v3

## 1. Ikhtisar & Arsitektur Solusi
Pengingat pembayaran sewa otomatis ABI Homestay mencakup siklus lengkap:
1. **Pra-Jatuh Tempo**: H-5, H-3, dan H-1 (pengingat awal dan persiapan pembayaran).
2. **Hari H (D-Day)**: H-0 (pemberitahuan resmi jatuh tempo hari ini).
3. **Keterlambatan (Overdue)**: H+1, H+3, dan H+7 (peringatan keterlambatan pembayaran bertahap).

### Mekanisme Verifikasi Pembayaran di Pemasukan:
Untuk mencegah pengiriman email penagihan keterlambatan (H+1, H+3, H+7) kepada penghuni yang sudah membayar:
- Sistem mengecek tabel `Transaction` untuk transaksi `type: "INCOME"` dengan `tenantId` terkait dalam rentang 30 hari sebelum `dateDue`.
- Jika sudah ada transaksi pemasukan: status ditandai `ALREADY_PAID` dan email peringatan keterlambatan **tidak dikirimkan**.
- Jika belum ada transaksi pemasukan: email peringatan dikirimkan via Brevo API v3.

---

## 2. Parameter Siklus Pengingat (`daysAhead`)

| Target | Nilai `daysAhead` | Subjek Email | Status Badge | Tindakan |
|---|---|---|---|---|
| H-5 | `5` | `[ABI Homestay] Pemberitahuan Jatuh Tempo Sewa Kamar {Kamar} (H-5)` | `#d97706` (Pemberitahuan Tagihan H-5) | Kirim pengingat awal |
| H-3 | `3` | `[ABI Homestay] Pengingat Jatuh Tempo Sewa Kamar {Kamar} (H-3)` | `#e11d48` (Peringatan Segera H-3) | Kirim pengingat persiapan |
| H-1 | `1` | `[ABI Homestay] Pengingat Terakhir: Jatuh Tempo Sewa Kamar {Kamar} Besok (H-1)` | `#b91c1c` (Jatuh Tempo Besok H-1) | Kirim pengingat terakhir |
| Hari H | `0` | `[ABI Homestay] Jatuh Tempo Hari Ini: Pembayaran Sewa Kamar {Kamar}` | `#991b1b` (Jatuh Tempo Hari Ini) | Kirim notifikasi jatuh tempo |
| H+1 | `-1` | `[ABI Homestay] Konfirmasi: Pembayaran Sewa Kamar {Kamar} Melewati Jatuh Tempo (H+1)` | `#c2410c` (Keterlambatan H+1) | Cek transaksi; kirim jika belum bayar |
| H+3 | `-3` | `[ABI Homestay] Peringatan: Keterlambatan Pembayaran Sewa Kamar {Kamar} (Lewat 3 Hari)` | `#991b1b` (Peringatan Tunggakan H+3) | Cek transaksi; kirim jika belum bayar |
| H+7 | `-7` | `[ABI Homestay] PERINGATAN KERAS: Keterlambatan Pembayaran Sewa Kamar {Kamar} (Lewat 7 Hari)` | `#7f1d1d` (Peringatan Keras H+7) | Cek transaksi; kirim jika belum bayar |

---

## 3. Komponen yang Disesuaikan

1. **`lib/email.ts`**:
   - `hasTenantPaidForDuePeriod(tenantId, dateDue)`: Helper validasi transaksi pemasukan.
   - `generateDueReminderHtml(data)`: Generator HTML mendukung `daysLeft` positif (pra-jatuh tempo), `0` (Hari H), dan negatif (keterlambatan H+1, H+3, H+7).
   - `processTenantDueReminders(daysAhead)`: Eksekusi batch pencarian tenant sesuai target tanggal dan penanganan status `ALREADY_PAID`, `SENT`, `NO_EMAIL`, `FAILED`.
   - `sendDueReminderReport(recipientEmail)`: Orkestrasi 7 siklus (H-5, H-3, H-1, H0, H+1, H+3, H+7) dan kirim rekap ke pengelola.
2. **`app/api/cron/reminders/route.ts`**:
   - Menjalankan 7 siklus pengingat personal.
3. **`app/actions.ts`**:
   - `triggerDueRemindersAction`: Pemicu manual di dashboard untuk memproses siklus lengkap.
4. **`app/penghuni/page.tsx`**:
   - Label di UI diperbarui: `Email Pengingat (H-5 s/d H+7)`.
