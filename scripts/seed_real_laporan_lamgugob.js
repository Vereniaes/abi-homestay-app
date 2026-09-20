const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Data Laporan Lamgugob
const REAL_DATA_RECORDS = [
  // Page 1
  { room: "01", name: "SADIT", dateIn: "2025-10-06", dateDue: "2026-10-06", period: "1 TAHUN", note: "" },
  { room: "02", name: "ALTHAF", dateIn: "2026-08-16", dateDue: "2027-02-16", period: "6 BULAN", note: "" },
  { room: "03", name: "DAUD DALATA KARO KARO", dateIn: "2026-06-25", dateDue: "2027-06-25", period: "1 TAHUN", note: "" },
  { room: "04", name: "FARIDA", dateIn: "2026-07-27", dateDue: "2027-07-27", period: "1 TAHUN", note: "" },
  { room: "05", name: "KRISTO", dateIn: "2026-09-14", dateDue: "2027-03-14", period: "6 BULAN", note: "BSI FARABI" },
  { room: "06", name: "T.RIZKI", dateIn: "2026-08-18", dateDue: "2027-02-18", period: "6 BULAN", note: "" },
  { room: "07", name: "M.KAUSAR", dateIn: "2026-08-24", dateDue: "2026-09-24", period: "1 BULAN", note: "" },
  { room: "08", name: "ARSYA", dateIn: "2026-08-18", dateDue: "2027-02-18", period: "6 BULAN", note: "" },
  { room: "09", name: "REAS", dateIn: "2026-08-03", dateDue: "2027-02-03", period: "6 BULAN", note: "" },
  { room: "10", name: "ARYA WINATA", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", note: "" },
  { room: "11", name: "SYAMAUN HARUB", dateIn: "2026-09-17", dateDue: "2026-10-17", period: "1 BULAN", note: "" },
  { room: "12", name: "RISKI DL FITRA", dateIn: "2026-04-21", dateDue: "2026-10-21", period: "6 BULAN", note: "" },
  { room: "13", name: "HAFIZ", dateIn: "2026-08-17", dateDue: "2027-08-17", period: "1 TAHUN", note: "" },
  { room: "14", name: "AIYA BINATA", dateIn: "2026-09-09", dateDue: "2026-10-08", period: "1 BULAN", note: "" },
  { room: "15", name: "KASMAINI", dateIn: "2026-09-07", dateDue: "2026-10-07", period: "1 BULAN", note: "" },
  { room: "16", vacant: true },
  { room: "17", vacant: true },
  { room: "18", name: "DEVRIZAL", dateIn: "2026-08-06", dateDue: "2026-09-06", period: "1 BULAN", note: "PEMBAYARAN TGL 16 SEP 26" },

  // Page 2
  { room: "19", vacant: true },
  { room: "20", name: "RAZUL MUNAWARAH", dateIn: "2026-09-01", dateDue: "2026-10-01", period: "1 BULAN", note: "" },
  { room: "21", name: "SAIF RAUBIL", dateIn: "2026-09-10", dateDue: "2026-10-10", period: "1 BULAN", note: "" },
  { room: "22", name: "TROPICOLLO", isPartner: true, note: "Tropicollo Partner Room" },
  { room: "23", name: "MANFUT ZUFAN", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", note: "KBS" },
  { room: "24", name: "FAYYADH", dateIn: "2026-08-06", dateDue: "2027-08-06", period: "1 TAHUN", note: "" },
  { room: "25", name: "BAIR", dateIn: "2025-12-18", dateDue: "2026-12-18", period: "1 TAHUN", note: "" },
  { room: "26", name: "T. MUHAMMAD TAUFIQ", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", note: "BPD ABDUL ROZAK" },
  { room: "27", name: "TROPICOLLO", isPartner: true, note: "Tropicollo Partner Room" },
  { room: "28", name: "M. RESUS", dateIn: "2026-09-18", dateDue: "2027-09-18", period: "1 TAHUN", note: "SUDAH BAYAR 7 JT SISA 7 JT", paidAmount: 7000000 },
  { room: "29", name: "RADITYA", dateIn: "2026-09-01", dateDue: "2027-09-01", period: "1 TAHUN", note: "" },
  { room: "30", name: "RIZKI ALDAFA", dateIn: "2026-08-05", dateDue: "2027-02-05", period: "6 BULAN", note: "" },
  { room: "31", name: "M.AFRIAN NUR", dateIn: "2026-09-08", dateDue: "2026-10-08", period: "1 BULAN", note: "" },
  { room: "32", name: "HAIKAL", dateIn: "2026-09-05", dateDue: "2026-10-05", period: "1 BULAN", note: "" },
  { room: "33", vacant: true },
  { room: "34", name: "MUKSIDIN", dateIn: "2026-08-31", dateDue: "2027-08-31", period: "1 TAHUN", note: "" },
  { room: "35", name: "M. YASIR", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", note: "Kamar Berdua bersama Asya", paidAmount: 14000000 },
  { room: "35", name: "ASYA", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", note: "Kamar Berdua bersama M. Yasir", paidAmount: 14000000 },
  { room: "36", name: "TROPICOLLO", isPartner: true, note: "Tropicollo Partner Room" },
  { room: "37", name: "NAZWAN ARIF RITONGAN", dateIn: "2026-09-13", dateDue: "2026-10-13", period: "1 BULAN", note: "BSI FARABI" },

  // Page 3
  { room: "38", vacant: true },
  { room: "39", vacant: true },
  { room: "40", maintenance: true, note: "TIDAK ADA TV" },
  { room: "41", name: "M.ARIFLO", dateIn: "2026-09-12", dateDue: "2026-10-12", period: "1 BULAN", note: "" },
  { room: "42", name: "RADITYA", dateIn: "2026-09-15", dateDue: "2026-10-15", period: "1 BULAN", note: "BSI FARABI" },
  { room: "43", name: "HABIB", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", note: "BPD KBS" },
  { room: "44", name: "HIRMA ASTUTI", dateIn: "2026-09-14", dateDue: "2026-10-14", period: "1 BULAN", note: "" },
  { room: "45", name: "SAFRIZAN", dateIn: "2026-09-14", dateDue: "2026-10-14", period: "1 BULAN", note: "BSI FARABI" },
  { room: "46", name: "RADIUL FATA", dateIn: "2026-09-10", dateDue: "2026-10-10", period: "1 BULAN", note: "" },
  { room: "47", name: "RAFIF MUHAMMAD", dateIn: "2026-08-18", dateDue: "2027-08-18", period: "1 TAHUN", note: "" },
  { room: "48", name: "M.ATARIQ", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", note: "" },
  { room: "49", vacant: true },
  { room: "50", vacant: true },
  { room: "51", name: "M. ADID HADIUL AUFAL", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", note: "" },
  { room: "52", vacant: true },
  { room: "53", name: "RIZKI ALDAFA", dateIn: "2026-09-13", dateDue: "2026-10-13", period: "1 BULAN", note: "BSI FARABI" },
  { room: "54", vacant: true },
  { room: "55", name: "NAZWAN RAFA", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", note: "" },
  { room: "56", vacant: true },
  { room: "57", vacant: true },

  // Page 4
  { room: "58", name: "M RAJA", dateIn: "2026-09-02", dateDue: "2026-10-02", period: "1 BULAN", note: "" }
];

const EXPENSES = [
  { desc: "Pembelian Token Listrik Homestay 500k x 3", amount: 1500000, date: "2026-09-03", method: "CASH" },
  { desc: "Tagihan Internet WiFi Dedicated 100 Mbps", amount: 650000, date: "2026-09-05", method: "TRANSFER" },
  { desc: "Pembayaran Tagihan Air PDAM Bulanan", amount: 780000, date: "2026-09-08", method: "TRANSFER" },
  { desc: "Biaya Kebersihan Lingkungan & Retribusi Sampah", amount: 350000, date: "2026-09-10", method: "CASH" },
  { desc: "Service Rutin & Cuci AC 6 Kamar", amount: 450000, date: "2026-09-12", method: "TRANSFER" },
  { desc: "Belanja Perlengkapan Pembersih & Sabun Cuci", amount: 280000, date: "2026-09-15", method: "CASH" },
  { desc: "Beli Galon Air Mineral & Kebutuhan Pantry", amount: 140000, date: "2026-09-18", method: "CASH" }
];

async function main() {
  console.log("🚀 MEMULAI IMPOR DATA NYATA 'LAPORAN LAMGUGOB'...");

  // 1. Bersihkan transaksi dan tenant lama
  console.log("🧹 Membersihkan data transaksi & tenant lama...");
  await prisma.transaction.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Ambil atau buat 58 Kamar (01 - 58)
  console.log("🏢 Mempersiapkan 58 kamar...");
  const roomsMap = new Map();
  for (let i = 1; i <= 58; i++) {
    const roomNum = String(i).padStart(2, "0");
    const room = await prisma.room.upsert({
      where: { number: roomNum },
      update: {
        status: "AVAILABLE",
        inventories: [
          { item: "Kasur Springbed", state: "BAIK" },
          { item: "AC Daikin 1/2 PK", state: "BAIK" },
          { item: "Smart TV 32 Inch", state: (i === 40 ? "RUSAK" : "BAIK") },
          { item: "Lemari Pakaian 2 Pintu", state: "BAIK" },
          { item: "Meja & Kursi Kerja", state: "BAIK" },
          { item: "Water Heater Ariston", state: "BAIK" }
        ]
      },
      create: {
        number: roomNum,
        status: "AVAILABLE",
        inventories: [
          { item: "Kasur Springbed", state: "BAIK" },
          { item: "AC Daikin 1/2 PK", state: "BAIK" },
          { item: "Smart TV 32 Inch", state: (i === 40 ? "RUSAK" : "BAIK") },
          { item: "Lemari Pakaian 2 Pintu", state: "BAIK" },
          { item: "Meja & Kursi Kerja", state: "BAIK" },
          { item: "Water Heater Ariston", state: "BAIK" }
        ]
      }
    });
    roomsMap.set(roomNum, room);
  }

  // 3. Masukkan data penghuni berdasarkan LAPORAN LAMGUGOB
  console.log("👤 Memasukkan data penghuni asli...");
  let occupiedCount = 0;
  let maintenanceCount = 0;
  let availableCount = 0;
  let txCount = 0;

  for (const item of REAL_DATA_RECORDS) {
    const room = roomsMap.get(item.room);
    if (!room) continue;

    if (item.maintenance) {
      // Kamar 40 - Perbaikan (Tidak ada TV)
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "MAINTENANCE" }
      });
      maintenanceCount++;
      continue;
    }

    if (item.vacant) {
      // Kamar Kosong
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "AVAILABLE" }
      });
      availableCount++;
      continue;
    }

    // Kamar Terisi (Penghuni / Mitra Tropicollo)
    let rentType = "MONTHLY";
    let rentAmount = 2500000;
    if (item.period === "1 TAHUN") {
      rentType = "YEARLY";
      rentAmount = item.paidAmount ? item.paidAmount : 28000000;
    } else if (item.period === "6 BULAN") {
      rentType = "SEMESTERLY";
      rentAmount = 8000000;
    } else if (item.isPartner) {
      rentType = "YEARLY";
      rentAmount = 28000000;
    }

    const dateIn = item.dateIn ? new Date(`${item.dateIn}T00:00:00.000Z`) : new Date("2026-09-01T00:00:00.000Z");
    const dateDue = item.dateDue ? new Date(`${item.dateDue}T00:00:00.000Z`) : new Date("2026-10-01T00:00:00.000Z");

    const now = new Date("2026-09-20T00:00:00.000Z");
    const diffDays = Math.ceil((dateDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let tenantStatus = "ACTIVE";
    if (diffDays <= 7 && diffDays >= 0) {
      tenantStatus = "EXPIRING_SOON";
    } else if (diffDays < 0) {
      tenantStatus = "EXPIRING_SOON"; // Due past date
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: item.name,
        phone: "-",
        roomId: room.id,
        status: tenantStatus,
        dateIn: dateIn,
        dateDue: dateDue,
        rentType: rentType,
        rentAmount: rentAmount
      }
    });

    // Update status kamar jadi OCCUPIED
    await prisma.room.update({
      where: { id: room.id },
      data: { status: "OCCUPIED" }
    });
    occupiedCount++;

    // Buat transaksi pembayaran sewa
    const refId = `INV-${item.room}-${dateIn.getFullYear()}${String(dateIn.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const noteText = item.note ? ` (${item.note})` : "";
    
    await prisma.transaction.create({
      data: {
        refId: refId,
        type: "INCOME",
        tenantId: tenant.id,
        roomId: room.id,
        rentType: rentType,
        amount: rentAmount,
        description: `Pembayaran Sewa Kamar ${item.room} - ${item.name} (${item.period || "Mitra"})${noteText}`,
        paymentMethod: "TRANSFER",
        date: dateIn
      }
    });
    txCount++;
  }

  // 4. Masukkan Pengeluaran Operasional September 2026
  console.log("💸 Memasukkan pengeluaran operasional September 2026...");
  for (let i = 0; i < EXPENSES.length; i++) {
    const exp = EXPENSES[i];
    await prisma.transaction.create({
      data: {
        refId: `EXP-202609-${String(i + 1).padStart(3, "0")}`,
        type: "EXPENSE",
        amount: exp.amount,
        description: exp.desc,
        paymentMethod: exp.method,
        date: new Date(`${exp.date}T08:30:00.000Z`)
      }
    });
    txCount++;
  }

  const finalTotalRooms = await prisma.room.count();
  const finalOccupied = await prisma.room.count({ where: { status: "OCCUPIED" } });
  const finalAvailable = await prisma.room.count({ where: { status: "AVAILABLE" } });
  const finalMaintenance = await prisma.room.count({ where: { status: "MAINTENANCE" } });
  const finalTenants = await prisma.tenant.count();
  const finalTxCount = await prisma.transaction.count();

  console.log("\n==================================================");
  console.log("🎉 SEEDING LAPORAN LAMGUGOB BERHASIL!");
  console.log(`🏠 Total Kamar       : ${finalTotalRooms}`);
  console.log(`🟢 Terisi (Occupied) : ${finalOccupied}`);
  console.log(`🟡 Kosong (Available): ${finalAvailable}`);
  console.log(`🔴 Perbaikan (Maint) : ${finalMaintenance}`);
  console.log(`👤 Total Penghuni    : ${finalTenants}`);
  console.log(`🧾 Total Transaksi   : ${finalTxCount}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
