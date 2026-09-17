const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMMY_TENANTS = [
  {
    name: "Ahmad Fauzi",
    phone: "0812-3456-7801",
    roomNumber: "03",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-08-19"),
    dateDue: new Date("2026-09-19"), // H-2 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-08-19"),
  },
  {
    name: "Budi Santoso",
    phone: "0856-7890-1202",
    roomNumber: "04",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-08-21"),
    dateDue: new Date("2026-09-21"), // H-4 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-08-21"),
  },
  {
    name: "Citra Kirana",
    phone: "0821-9876-5403",
    roomNumber: "05",
    rentType: "WEEKLY",
    rentAmount: 900000,
    dateIn: new Date("2026-09-11"),
    dateDue: new Date("2026-09-18"), // H-1 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-11"),
  },
  {
    name: "Dimas Anggara",
    phone: "0877-1234-5604",
    roomNumber: "06",
    rentType: "DAILY",
    rentAmount: 150000,
    dateIn: new Date("2026-09-16"),
    dateDue: new Date("2026-09-17"), // Hari ini (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-16"),
  },
  {
    name: "Eka Rahmawati",
    phone: "0819-3333-4405",
    roomNumber: "07",
    rentType: "SEMESTERLY",
    rentAmount: 8000000,
    dateIn: new Date("2026-06-01"),
    dateDue: new Date("2026-12-01"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-06-01"),
  },
  {
    name: "Fajar Pratama",
    phone: "0813-1111-2206",
    roomNumber: "08",
    rentType: "YEARLY",
    rentAmount: 28000000,
    dateIn: new Date("2026-01-10"),
    dateDue: new Date("2027-01-10"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-01-10"),
  },
  {
    name: "Gita Savitri",
    phone: "0814-9999-8807",
    roomNumber: "09",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-09-05"),
    dateDue: new Date("2026-10-05"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-09-05"),
  },
  {
    name: "Hadi Gunawan",
    phone: "0852-4455-6608",
    roomNumber: "10",
    rentType: "WEEKLY",
    rentAmount: 900000,
    dateIn: new Date("2026-09-15"),
    dateDue: new Date("2026-09-22"), // H-5 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-15"),
  },
  {
    name: "Indra Lesmana",
    phone: "0878-7788-9909",
    roomNumber: "11",
    rentType: "DAILY",
    rentAmount: 150000,
    dateIn: new Date("2026-09-17"),
    dateDue: new Date("2026-09-18"), // H-1 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-17"),
  },
  {
    name: "Jovanka Putri",
    phone: "0812-9988-7710",
    roomNumber: "12",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-09-01"),
    dateDue: new Date("2026-10-01"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-09-01"),
  },
  {
    name: "Kevin Sanjaya",
    phone: "0857-1122-3311",
    roomNumber: "14",
    rentType: "SEMESTERLY",
    rentAmount: 8000000,
    dateIn: new Date("2026-04-15"),
    dateDue: new Date("2026-10-15"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-04-15"),
  },
  {
    name: "Larasati Dewi",
    phone: "0813-5566-7712",
    roomNumber: "15",
    rentType: "YEARLY",
    rentAmount: 28000000,
    dateIn: new Date("2026-03-01"),
    dateDue: new Date("2027-03-01"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-03-01"),
  },
  {
    name: "Muhammad Ilham",
    phone: "0823-3344-5513",
    roomNumber: "16",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-09-08"),
    dateDue: new Date("2026-10-08"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-09-08"),
  },
  {
    name: "Nadia Saphira",
    phone: "0881-2233-4414",
    roomNumber: "17",
    rentType: "WEEKLY",
    rentAmount: 900000,
    dateIn: new Date("2026-09-14"),
    dateDue: new Date("2026-09-21"), // H-4 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-14"),
  },
  {
    name: "Oscar Lawalata",
    phone: "0896-7788-9915",
    roomNumber: "19",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-08-25"),
    dateDue: new Date("2026-09-25"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-08-25"),
  },
  {
    name: "Putri Marino",
    phone: "0812-7766-5516",
    roomNumber: "20",
    rentType: "DAILY",
    rentAmount: 150000,
    dateIn: new Date("2026-09-17"),
    dateDue: new Date("2026-09-18"), // H-1 (Expiring Soon)
    status: "EXPIRING_SOON",
    txDate: new Date("2026-09-17"),
  },
  {
    name: "Rangga Sasana",
    phone: "0858-6677-8817",
    roomNumber: "22",
    rentType: "SEMESTERLY",
    rentAmount: 8000000,
    dateIn: new Date("2026-05-10"),
    dateDue: new Date("2026-11-10"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-05-10"),
  },
  {
    name: "Siti Badriah",
    phone: "0822-8899-0018",
    roomNumber: "23",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-08-30"),
    dateDue: new Date("2026-09-30"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-08-30"),
  },
  {
    name: "Taufik Hidayat",
    phone: "0813-4455-6619",
    roomNumber: "24",
    rentType: "YEARLY",
    rentAmount: 28000000,
    dateIn: new Date("2026-02-15"),
    dateDue: new Date("2027-02-15"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-02-15"),
  },
  {
    name: "Vina Panduwinata",
    phone: "0853-2233-4420",
    roomNumber: "25",
    rentType: "MONTHLY",
    rentAmount: 2500000,
    dateIn: new Date("2026-09-10"),
    dateDue: new Date("2026-10-10"), // Active
    status: "ACTIVE",
    txDate: new Date("2026-09-10"),
  },
];

const MAINTENANCE_ROOMS = [
  { roomNumber: "18", inventories: ["perbaikan", "baik", "baik", "baik", "baik"] }, // AC
  { roomNumber: "27", inventories: ["baik", "perbaikan", "baik", "baik", "baik"] }, // TV
  { roomNumber: "32", inventories: ["baik", "baik", "perbaikan", "baik", "baik"] }, // Kasur
  { roomNumber: "35", inventories: ["perbaikan", "baik", "baik", "perbaikan", "baik"] }, // AC & Kunci
  { roomNumber: "42", inventories: ["baik", "baik", "baik", "baik", "perbaikan"] }, // Tembok
  { roomNumber: "45", inventories: ["perbaikan", "baik", "perbaikan", "baik", "baik"] }, // AC & Kasur
  { roomNumber: "52", inventories: ["baik", "perbaikan", "baik", "baik", "perbaikan"] }, // TV & Tembok
  { roomNumber: "57", inventories: ["perbaikan", "baik", "baik", "baik", "baik"] }, // AC
];

const EXPENSE_TRANSACTIONS = [
  {
    description: "Pembelian Token Listrik Homestay",
    amount: 1500000,
    date: new Date("2026-09-17T09:30:00.000Z"),
    paymentMethod: "CASH",
  },
  {
    description: "Biaya Kebersihan & Angkut Sampah Lingkungan",
    amount: 350000,
    date: new Date("2026-09-16T11:00:00.000Z"),
    paymentMethod: "CASH",
  },
  {
    description: "Service Rutin AC Panasonic 8 Kamar",
    amount: 600000,
    date: new Date("2026-09-14T14:15:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Pembayaran Tagihan PDAM Air Bersih",
    amount: 820000,
    date: new Date("2026-09-10T10:00:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Pembayaran Tagihan Internet WiFi Dedicated",
    amount: 750000,
    date: new Date("2026-09-05T08:45:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Pembelian Sabun, Pel, Pembersih Kamar Mandi & Alat Kebersihan",
    amount: 450000,
    date: new Date("2026-09-01T15:20:00.000Z"),
    paymentMethod: "CASH",
  },
  {
    description: "Penggantian 10 Set Sprei & Bedcover Katun",
    amount: 1750000,
    date: new Date("2026-08-20T13:10:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Biaya Perbaikan Pompa Air Submersible & Pipa Tandon",
    amount: 1350000,
    date: new Date("2026-08-10T16:00:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Pembelian Cat Dinding Nippon Paint & Upah Pengecatan",
    amount: 2400000,
    date: new Date("2026-07-15T09:00:00.000Z"),
    paymentMethod: "CASH",
  },
  {
    description: "Service & Penggantian Sparepart Water Heater",
    amount: 850000,
    date: new Date("2026-06-20T11:30:00.000Z"),
    paymentMethod: "TRANSFER",
  },
  {
    description: "Jasa Fogging Nyamuk & Pest Control Homestay",
    amount: 500000,
    date: new Date("2026-05-12T08:00:00.000Z"),
    paymentMethod: "CASH",
  },
  {
    description: "Pengadaan Smart Door Lock Digital Kamar",
    amount: 3200000,
    date: new Date("2026-03-10T14:00:00.000Z"),
    paymentMethod: "TRANSFER",
  },
];

async function main() {
  console.log("Memulai proses input 20 data dummy penghuni, transaksi, dan perbaikan...");

  // 1. Dapatkan semua kamar yang ada
  const allRooms = await prisma.room.findMany();
  const roomMap = new Map();
  allRooms.forEach((r) => roomMap.set(r.number, r));

  // Pastikan kamar 01 sampai 58 tersedia
  for (let i = 1; i <= 58; i++) {
    const num = i.toString().padStart(2, "0");
    if (!roomMap.has(num)) {
      const created = await prisma.room.create({
        data: {
          number: num,
          status: "AVAILABLE",
          inventories: ["baik", "baik", "baik", "baik", "baik"],
        },
      });
      roomMap.set(num, created);
    }
  }

  // 2. Input 20 Dummy Tenants & transaksi pemasukan mereka
  let tenantSuccessCount = 0;
  let txIncomeCount = 0;

  for (const t of DUMMY_TENANTS) {
    const room = roomMap.get(t.roomNumber);
    if (!room) continue;

    // Cek jika tenant dengan nama ini sudah ada, jika ada skip atau update
    const existing = await prisma.tenant.findFirst({
      where: { name: t.name, roomId: room.id },
    });

    let tenantId;
    if (existing) {
      tenantId = existing.id;
      await prisma.tenant.update({
        where: { id: existing.id },
        data: {
          phone: t.phone,
          status: t.status,
          dateIn: t.dateIn,
          dateDue: t.dateDue,
          rentType: t.rentType,
          rentAmount: t.rentAmount,
        },
      });
    } else {
      const newTenant = await prisma.tenant.create({
        data: {
          name: t.name,
          phone: t.phone,
          roomId: room.id,
          status: t.status,
          dateIn: t.dateIn,
          dateDue: t.dateDue,
          rentType: t.rentType,
          rentAmount: t.rentAmount,
        },
      });
      tenantId = newTenant.id;
      tenantSuccessCount++;
    }

    // Set room status to OCCUPIED
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "OCCUPIED",
        inventories: ["baik", "baik", "baik", "baik", "baik"],
      },
    });

    // Buat transaksi pemasukan untuk tenant ini
    const refId = `TRX-IN-${t.roomNumber}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const methods = ["TRANSFER", "QRIS", "CASH"];
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];

    await prisma.transaction.create({
      data: {
        refId,
        type: "INCOME",
        tenantId,
        roomId: room.id,
        rentType: t.rentType,
        amount: t.rentAmount,
        description: `Pembayaran Sewa Kamar ${t.roomNumber} (${t.rentType}) - ${t.name}`,
        paymentMethod: randomMethod,
        date: t.txDate,
      },
    });
    txIncomeCount++;
  }

  // 3. Set maintenance rooms (Kamar perbaikan)
  let maintenanceCount = 0;
  for (const m of MAINTENANCE_ROOMS) {
    const room = roomMap.get(m.roomNumber);
    if (room) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: "MAINTENANCE",
          inventories: m.inventories,
        },
      });
      maintenanceCount++;
    }
  }

  // 4. Input transaksi pengeluaran (Expenses)
  let txExpenseCount = 0;
  for (const exp of EXPENSE_TRANSACTIONS) {
    const refId = `TRX-OUT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    await prisma.transaction.create({
      data: {
        refId,
        type: "EXPENSE",
        amount: exp.amount,
        description: exp.description,
        paymentMethod: exp.paymentMethod,
        date: exp.date,
      },
    });
    txExpenseCount++;
  }

  console.log(`\n=== HASIL SEED DATA DUMMY ===`);
  console.log(`- Dummy Penghuni Berhasil Dimasukkan: ${tenantSuccessCount} orang`);
  console.log(`- Transaksi Pemasukan (Income): ${txIncomeCount} transaksi`);
  console.log(`- Transaksi Pengeluaran (Expense): ${txExpenseCount} transaksi`);
  console.log(`- Kamar Status Perbaikan (Maintenance): ${maintenanceCount} kamar`);
  console.log(`=============================\n`);
}

main()
  .catch((e) => {
    console.error("Error executing seed_dummy_20:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
