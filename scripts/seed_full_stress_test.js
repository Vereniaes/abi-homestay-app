const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INDONESIAN_FIRST_NAMES = [
  "Ahmad", "Muhammad", "Rizky", "Budi", "Dimas", "Fajar", "Hendra", "Indra", "Joko", "Kevin",
  "Lukman", "Naufal", "Pratama", "Raditya", "Rangga", "Surya", "Taufik", "Wahyu", "Yoga", "Zulfikar",
  "Siti", "Nur", "Dewi", "Citra", "Eka", "Gita", "Indah", "Larasati", "Maya", "Nabila",
  "Putri", "Rina", "Sari", "Tia", "Vina", "Winda", "Yulia", "Zahra", "Adinda", "Bunga",
  "Farhan", "Bagas", "Ilham", "Bayu", "Aldi", "Reza", "Dian", "Anisa", "Mega", "Fitri",
  "Hafizh", "Agus", "Tri", "Saputra", "Wicaksono", "Kurniawan", "Setiawan", "Gunawan", "Utami", "Kusuma"
];

const INDONESIAN_LAST_NAMES = [
  "Pratama", "Saputra", "Kurniawan", "Wijaya", "Santoso", "Hidayat", "Nugraha", "Kusuma", "Setiawan", "Siregar",
  "Nasution", "Lestari", "Putri", "Wulandari", "Rahmawati", "Permata", "Sari", "Utami", "Astuti", "Anggraini",
  "Wibowo", "Syahputra", "Ramadhan", "Firmansyah", "Maulana", "Irawan", "Subagyo", "Hartono", "Susanto", "Pangestu"
];

const EXPENSE_CATEGORIES = [
  { desc: "Pembelian Token Listrik Homestay 500k x 3", amount: 1500000, method: "CASH" },
  { desc: "Service Rutin & Cuci AC 6 Kamar", amount: 450000, method: "TRANSFER" },
  { desc: "Pembayaran Tagihan Air PDAM Bulanan", amount: 780000, method: "TRANSFER" },
  { desc: "Tagihan Internet WiFi Dedicated 100 Mbps", amount: 650000, method: "TRANSFER" },
  { desc: "Biaya Kebersihan Lingkungan & Retribusi Sampah", amount: 350000, method: "CASH" },
  { desc: "Belanja Perlengkapan Pembersih & Sabun Cuci", amount: 280000, method: "CASH" },
  { desc: "Penggantian Lampu LED & Stop Kontak Kamar", amount: 195000, method: "CASH" },
  { desc: "Service Pompa Air & Filter Tandon", amount: 850000, method: "TRANSFER" },
  { desc: "Penggantian Kran Kamar Mandi & Pipa Bocor", amount: 320000, method: "CASH" },
  { desc: "Pengadaan 10 Set Sprei Katun & Sarung Bantal", amount: 1650000, method: "TRANSFER" },
  { desc: "Jasa Fogging & Pest Control Area Homestay", amount: 500000, method: "CASH" },
  { desc: "Pengecatan Ulang Dinding Lorong & Upah Tukang", amount: 230000, method: "CASH" },
  { desc: "Beli Galon Air Mineral & Kebutuhan Pantry", amount: 140000, method: "CASH" },
  { desc: "Maintenance Smart Door Lock & Penggantian Baterai", amount: 380000, method: "TRANSFER" },
  { desc: "Perbaikan Engsel Pintu & Lemari Pakaian", amount: 250000, method: "CASH" }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone(idx) {
  const prefixes = ["0812", "0813", "0821", "0857", "0878", "0896", "0852", "0881"];
  const prefix = prefixes[idx % prefixes.length];
  const num1 = String(1000 + (idx * 37) % 9000).padStart(4, "0");
  const num2 = String(1000 + (idx * 73) % 9000).padStart(4, "0");
  return `${prefix}-${num1}-${num2}`;
}

async function main() {
  console.log("🚀 MEMULAI SEEDING DATA DUMMY LENGKAP & REALISTIS (58 KAMAR, 70+ PENGHUNI, 200+ TRANSAKSI)...");

  // 1. Bersihkan transaksi dan tenant lama agar data benar-benar rapi & sinkron
  console.log("🧹 Membersihkan data transaksi & tenant lama...");
  await prisma.transaction.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Pastikan 58 Kamar (01 s/d 58) tersedia di database
  console.log("🏢 Mempersiapkan 58 kamar...");
  const rooms = [];
  
  // Kamar yang butuh perbaikan inventaris (12 kamar beragam)
  const maintenanceRoomNumbers = new Set(["04", "08", "13", "18", "21", "27", "31", "35", "42", "45", "52", "57"]);

  for (let i = 1; i <= 58; i++) {
    const roomNumber = i.toString().padStart(2, "0");
    const isMaint = maintenanceRoomNumbers.has(roomNumber);
    
    // Inventaris: jika maintenance, beri status "perbaikan" pada salah satu / dua item
    let inventories = ["baik", "baik", "baik", "baik", "baik"];
    if (isMaint) {
      if (i % 4 === 0) inventories = ["perbaikan", "baik", "baik", "baik", "baik"]; // AC
      else if (i % 4 === 1) inventories = ["baik", "perbaikan", "baik", "baik", "baik"]; // TV
      else if (i % 4 === 2) inventories = ["baik", "baik", "perbaikan", "baik", "baik"]; // Kasur
      else inventories = ["perbaikan", "baik", "baik", "baik", "perbaikan"]; // AC & Tembok
    }

    const room = await prisma.room.upsert({
      where: { number: roomNumber },
      update: {
        status: isMaint ? "MAINTENANCE" : "OCCUPIED",
        inventories: inventories,
      },
      create: {
        number: roomNumber,
        status: isMaint ? "MAINTENANCE" : "OCCUPIED",
        inventories: inventories,
      },
    });
    rooms.push(room);
  }
  console.log(`✅ ${rooms.length} kamar berhasil disiapkan (${maintenanceRoomNumbers.size} dengan catatan perbaikan inventaris).`);

  // 3. Masukkan 70 Penghuni Dummy ke 58 Kamar
  console.log("👥 Mengisi data penghuni ke seluruh 58 kamar...");
  const rentTypes = ["MONTHLY", "MONTHLY", "MONTHLY", "MONTHLY", "WEEKLY", "DAILY", "SEMESTERLY", "YEARLY"];
  const rentAmounts = {
    DAILY: 150000,
    WEEKLY: 900000,
    MONTHLY: 2500000,
    SEMESTERLY: 8000000,
    YEARLY: 28000000,
  };

  const createdTenants = [];
  const now = new Date("2026-09-17T12:00:00.000Z");

  // Setiap kamar 1 sampai 58 minimal memiliki 1 penghuni
  // Beberapa kamar (12 kamar) memiliki 2 penghuni (kamar double)
  let tenantIndex = 0;
  for (let i = 0; i < 58; i++) {
    const room = rooms[i];
    const occupantsInThisRoom = (i % 5 === 0 && i < 50) ? 2 : 1; // Kamar kelipatan 5 isi 2 orang

    for (let occ = 0; occ < occupantsInThisRoom; occ++) {
      tenantIndex++;
      const firstName = INDONESIAN_FIRST_NAMES[(tenantIndex * 3) % INDONESIAN_FIRST_NAMES.length];
      const lastName = INDONESIAN_LAST_NAMES[(tenantIndex * 7) % INDONESIAN_LAST_NAMES.length];
      const name = `${firstName} ${lastName}`;
      const phone = getRandomPhone(tenantIndex);
      const rentType = rentTypes[tenantIndex % rentTypes.length];
      const rentAmount = rentAmounts[rentType];

      // Variasi tanggal masuk dan jatuh tempo
      let dateIn = new Date(now);
      let dateDue = new Date(now);
      let status = "ACTIVE";

      // Distribusi jatuh tempo untuk menguji semua notifikasi:
      if (tenantIndex % 10 === 1) {
        // H-0 / Hari ini jatuh tempo
        dateIn.setDate(now.getDate() - 30);
        dateDue = new Date(now);
        status = "EXPIRING_SOON";
      } else if (tenantIndex % 10 === 2) {
        // H-1 jatuh tempo besok
        dateIn.setDate(now.getDate() - 29);
        dateDue.setDate(now.getDate() + 1);
        status = "EXPIRING_SOON";
      } else if (tenantIndex % 10 === 3) {
        // H-3 jatuh tempo
        dateIn.setDate(now.getDate() - 27);
        dateDue.setDate(now.getDate() + 3);
        status = "EXPIRING_SOON";
      } else if (tenantIndex % 10 === 4) {
        // H-6 jatuh tempo (masih dalam H-7 notifikasi)
        dateIn.setDate(now.getDate() - 24);
        dateDue.setDate(now.getDate() + 6);
        status = "EXPIRING_SOON";
      } else if (tenantIndex % 10 === 5) {
        // 2 minggu lagi
        dateIn.setDate(now.getDate() - 15);
        dateDue.setDate(now.getDate() + 15);
        status = "ACTIVE";
      } else if (tenantIndex % 10 === 6) {
        // 3 minggu lagi
        dateIn.setDate(now.getDate() - 9);
        dateDue.setDate(now.getDate() + 21);
        status = "ACTIVE";
      } else if (tenantIndex % 10 === 7) {
        // 3 bulan lagi (Semesteran)
        dateIn.setMonth(now.getMonth() - 3);
        dateDue.setMonth(now.getMonth() + 3);
        status = "ACTIVE";
      } else if (tenantIndex % 10 === 8) {
        // 6 bulan lagi (Tahunan)
        dateIn.setMonth(now.getMonth() - 6);
        dateDue.setMonth(now.getMonth() + 6);
        status = "ACTIVE";
      } else {
        // 10 hari lagi
        dateIn.setDate(now.getDate() - 20);
        dateDue.setDate(now.getDate() + 10);
        status = "ACTIVE";
      }

      const created = await prisma.tenant.create({
        data: {
          name,
          phone,
          roomId: room.id,
          status,
          dateIn,
          dateDue,
          rentType,
          rentAmount,
        },
      });
      createdTenants.push({ ...created, roomNumber: room.number });
    }
  }
  console.log(`✅ ${createdTenants.length} penghuni berhasil dimasukkan ke seluruh 58 kamar.`);

  // 4. Masukkan 220+ Transaksi Keuangan Realistis (Income & Expense dari 2025 s/d Sep 2026)
  console.log("💰 Menghasilkan 220+ riwayat transaksi keuangan lengkap...");
  const paymentMethods = ["TRANSFER", "QRIS", "CASH"];
  const transactionsToCreate = [];

  // A. Pemasukan (Income) dari setiap penghuni untuk bulan berjalan (September 2026)
  createdTenants.forEach((t, idx) => {
    const day = (idx % 17) + 1; // Tanggal 1 s/d 17 September 2026
    const txDate = new Date(`2026-09-${String(day).padStart(2, "0")}T${String(8 + (idx % 12)).padStart(2, "0")}:30:00.000Z`);
    const pMethod = paymentMethods[idx % paymentMethods.length];

    transactionsToCreate.push({
      refId: `TRX-202609-${t.roomNumber}-${String(idx + 1).padStart(3, "0")}`,
      type: "INCOME",
      tenantId: t.id,
      roomId: t.roomId,
      rentType: t.rentType,
      amount: t.rentAmount,
      description: `Pembayaran Sewa Kamar ${t.roomNumber} (${t.rentType}) - ${t.name}`,
      paymentMethod: pMethod,
      date: txDate,
    });
  });

  // B. Pemasukan Historis (Agustus 2026, Juli 2026, Juni 2026, Mei 2026, April 2026, Maret 2026, Feb 2026, Jan 2026, dan 2025)
  const historicalMonths = [
    { year: 2026, month: 8, count: 25 },  // Agustus 2026
    { year: 2026, month: 7, count: 24 },  // Juli 2026
    { year: 2026, month: 6, count: 22 },  // Juni 2026
    { year: 2026, month: 5, count: 20 },  // Mei 2026
    { year: 2026, month: 4, count: 18 },  // April 2026
    { year: 2026, month: 3, count: 18 },  // Maret 2026
    { year: 2026, month: 2, count: 16 },  // Februari 2026
    { year: 2026, month: 1, count: 16 },  // Januari 2026
    { year: 2025, month: 12, count: 15 }, // Desember 2025
    { year: 2025, month: 11, count: 12 }, // November 2025
    { year: 2025, month: 10, count: 10 }, // Oktober 2025
  ];

  historicalMonths.forEach((hm) => {
    for (let j = 0; j < hm.count; j++) {
      const tenant = createdTenants[(j * 3 + hm.month) % createdTenants.length];
      const day = ((j * 3) % 28) + 1;
      const txDate = new Date(`${hm.year}-${String(hm.month).padStart(2, "0")}-${String(day).padStart(2, "0")}T10:00:00.000Z`);
      const pMethod = paymentMethods[(j + hm.month) % paymentMethods.length];

      transactionsToCreate.push({
        refId: `TRX-${hm.year}${String(hm.month).padStart(2, "0")}-${tenant.roomNumber}-${String(j + 1).padStart(3, "0")}`,
        type: "INCOME",
        tenantId: tenant.id,
        roomId: tenant.roomId,
        rentType: tenant.rentType,
        amount: tenant.rentAmount,
        description: `Pembayaran Sewa Kamar ${tenant.roomNumber} - ${tenant.name}`,
        paymentMethod: pMethod,
        date: txDate,
      });
    }
  });

  // C. Pengeluaran Operasional (Expenses) dari 2025 s/d September 2026
  const allMonthsForExpenses = [
    { year: 2026, month: 9, days: [1, 3, 5, 8, 10, 12, 14, 16, 17] },
    { year: 2026, month: 8, days: [2, 5, 10, 15, 20, 25] },
    { year: 2026, month: 7, days: [1, 6, 12, 18, 24] },
    { year: 2026, month: 6, days: [3, 9, 15, 22, 28] },
    { year: 2026, month: 5, days: [4, 11, 18, 25] },
    { year: 2026, month: 4, days: [2, 10, 17, 24] },
    { year: 2026, month: 3, days: [5, 12, 20, 27] },
    { year: 2026, month: 2, days: [3, 10, 18, 25] },
    { year: 2026, month: 1, days: [5, 12, 20, 28] },
    { year: 2025, month: 12, days: [4, 15, 22] },
    { year: 2025, month: 11, days: [6, 18, 26] },
  ];

  let expIdx = 0;
  allMonthsForExpenses.forEach((m) => {
    m.days.forEach((day) => {
      expIdx++;
      const cat = EXPENSE_CATEGORIES[expIdx % EXPENSE_CATEGORIES.length];
      const txDate = new Date(`${m.year}-${String(m.month).padStart(2, "0")}-${String(day).padStart(2, "0")}T14:20:00.000Z`);

      transactionsToCreate.push({
        refId: `TRX-EXP-${m.year}${String(m.month).padStart(2, "0")}-${String(day).padStart(2, "0")}-${String(expIdx).padStart(3, "0")}`,
        type: "EXPENSE",
        amount: cat.amount,
        description: cat.desc,
        paymentMethod: cat.method,
        date: txDate,
      });
    });
  });

  console.log(`⚡ Menginsert ${transactionsToCreate.length} transaksi ke database...`);
  // Insert in batches
  for (let i = 0; i < transactionsToCreate.length; i += 50) {
    const batch = transactionsToCreate.slice(i, i + 50);
    await Promise.all(
      batch.map((tx) =>
        prisma.transaction.create({
          data: tx,
        })
      )
    );
  }
  console.log(`✅ ${transactionsToCreate.length} transaksi berhasil disimpan!`);

  // 5. Update kamar status: jika ada tenant aktif dan kamar tidak berstatus maintenance, pastikan status OCCUPIED
  for (const r of rooms) {
    if (!maintenanceRoomNumbers.has(r.number)) {
      await prisma.room.update({
        where: { id: r.id },
        data: { status: "OCCUPIED" },
      });
    }
  }

  // 6. Ringkasan Akhir
  const finalRoomCount = await prisma.room.count();
  const finalTenantCount = await prisma.tenant.count();
  const finalTxCount = await prisma.transaction.count();
  const finalMaintCount = await prisma.room.count({ where: { status: "MAINTENANCE" } });

  console.log("\n=======================================================");
  console.log("🎉 HASIL STRESS-TEST SEEDING DATABASE ABI HOMESTAY 🎉");
  console.log(`- Total Kamar: ${finalRoomCount} / 58 (100% Terisi)`);
  console.log(`- Total Penghuni Aktif: ${finalTenantCount} orang`);
  console.log(`- Total Riwayat Transaksi: ${finalTxCount} transaksi`);
  console.log(`- Total Kamar Perbaikan Inventaris: ${finalMaintCount} kamar`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
