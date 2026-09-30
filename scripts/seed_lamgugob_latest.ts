import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Data Laporan Lamgugob Terbaru (Halaman 1)
const TENANTS_DATA = [
  { room: "01", name: "SADIT", dateIn: "2025-10-06", dateDue: "2026-10-06", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "02", name: "ALTHAF", dateIn: "2026-08-16", dateDue: "2027-02-16", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "03", name: "DAUD DALATA KARO KARO", dateIn: "2026-06-25", dateDue: "2027-06-25", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "04", name: "FARIDA", dateIn: "2026-07-27", dateDue: "2027-07-27", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "05", name: "KRISTO", dateIn: "2026-09-14", dateDue: "2027-03-14", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "BSI FARABI" },
  { room: "06", name: "T.RIZKI", dateIn: "2026-08-18", dateDue: "2027-02-18", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "07", name: "M.KAUSAR", dateIn: "2026-09-24", dateDue: "2026-10-24", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "08", name: "ARSYA", dateIn: "2026-08-18", dateDue: "2027-02-18", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "09", name: "REAS", dateIn: "2026-08-03", dateDue: "2027-02-03", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "10", name: "ARYA WINATA", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "11", name: "SYAMAUN HARUB", dateIn: "2026-09-17", dateDue: "2026-10-17", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "12", name: "RISKI DL FITRA", dateIn: "2026-04-21", dateDue: "2026-10-21", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "13", name: "HAFIZ", dateIn: "2026-08-17", dateDue: "2027-08-17", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "14", name: "AIYA BINATA", dateIn: "2026-09-09", dateDue: "2026-10-08", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "15", name: "KASMAINI", dateIn: "2026-09-07", dateDue: "2026-10-07", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  
  // Pelayaran Group (Kamar 16, 17, 19, 20)
  { room: "16", name: "SARI ABU", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "17", name: "SUDIRMAN", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "18", name: "DEVRIZAL", dateIn: "2026-09-06", dateDue: "2026-10-06", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BELUM BAYAR" },
  { room: "19", name: "KRISBONA", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "20", name: "USYOLI AKBAR SOFYAN", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },

  { room: "21", name: "SAIF RAUBIL", dateIn: "2026-09-10", dateDue: "2026-10-10", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "22", name: "TROPICOLLO", dateIn: "2026-01-01", dateDue: "2027-01-01", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 0, note: "GRATIS" },
  { room: "23", name: "MANFUT ZUFAN", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "KBS" },
  { room: "24", name: "FAYYADH", dateIn: "2026-08-06", dateDue: "2027-08-06", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "25", name: "BAIR", dateIn: "2025-12-18", dateDue: "2026-12-18", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "26", name: "T. MUHAMMAD TAUFIQ", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BPD ABDUL ROZAK" },
  { room: "27", name: "TROPICOLLO", dateIn: "2026-01-10", dateDue: "2027-01-10", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 12000000, note: "12 JT/TAHUN" },
  { room: "28", name: "M. RESUS", dateIn: "2026-09-18", dateDue: "2027-09-18", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 14000000, note: "SUDAH BAYAR 7 JT SISA 7 JT" },
  { room: "29", name: "RADITYA", dateIn: "2026-09-01", dateDue: "2027-09-01", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "30", name: "RIZKI ALDAFA", dateIn: "2026-08-05", dateDue: "2027-02-05", period: "6 BULAN", rentType: "SEMESTERLY", rentAmount: 8000000, note: "" },
  { room: "31", name: "M.AFRIAN NUR", dateIn: "2026-09-08", dateDue: "2026-10-08", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "32", name: "HAIKAL", dateIn: "2026-09-05", dateDue: "2026-10-05", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  
  // Pelayaran
  { room: "33", name: "MURDI HARIONO", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "34", name: "MUKSIDIN", dateIn: "2026-08-31", dateDue: "2027-08-31", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  
  // Kamar 35: M YASIR & ASYA
  { room: "35", name: "M YASIR", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 14000000, note: "Bersama Asya" },
  { room: "35", name: "ASYA", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 14000000, note: "Bersama M Yasir" },

  { room: "36", name: "TROPICOLLO", dateIn: "2026-01-10", dateDue: "2027-01-10", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 12000000, note: "12 JT/TAHUN" },
  { room: "37", name: "NAZWAN ARIF RITONGAN", dateIn: "2026-09-13", dateDue: "2026-10-13", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BSI FARABI" },
  
  // Pelayaran
  { room: "38", name: "SADITYA DWI KARHA", dateIn: "2026-09-17", dateDue: "2026-10-17", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "39", name: "RUSLI", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "40", name: "ZULKIFLI", dateIn: "2026-09-22", dateDue: "2026-10-22", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },

  { room: "41", name: "M.ARIFLO", dateIn: "2026-09-12", dateDue: "2026-10-12", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "42", name: "RADITYA", dateIn: "2026-09-15", dateDue: "2026-10-15", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BSI FARABI" },
  { room: "43", name: "HABIB", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BPD KBS" },
  { room: "44", name: "HIRMA ASTUTI", dateIn: "2026-09-14", dateDue: "2026-10-14", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "45", name: "SAFRIZAN", dateIn: "2026-09-14", dateDue: "2026-10-14", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BSI FARABI" },
  { room: "46", name: "RADIUL FATA", dateIn: "2026-09-10", dateDue: "2026-10-10", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "47", name: "RAFIF MUHAMMAD", dateIn: "2026-08-18", dateDue: "2027-08-18", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "48", name: "M.ATARIQ", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "49", name: "RAZUL MUNAWARAH", dateIn: "2026-09-01", dateDue: "2026-10-01", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  
  // Pelayaran
  { room: "50", name: "MEILANA ADINA PUTRA", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "51", name: "M. ADID HADIUL AUFAL", dateIn: "2026-09-06", dateDue: "2027-09-06", period: "1 TAHUN", rentType: "YEARLY", rentAmount: 28000000, note: "" },
  { room: "52", name: "SUYOTO", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "53", name: "RIZKI ALDAFA", dateIn: "2026-09-13", dateDue: "2026-10-13", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "BSI FARABI" },
  { room: "54", name: "LUKMAN", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "55", name: "NAZWAN RAFA", dateIn: "2026-09-09", dateDue: "2026-10-09", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" },
  { room: "56", name: "MUH SAKIR", dateIn: "2026-09-19", dateDue: "2026-10-19", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  { room: "57", name: "D JOKO TRY SEPTIAWAN", dateIn: "2026-09-20", dateDue: "2026-10-20", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1350000, note: "PELAYARAN" },
  
  { room: "58", name: "M RAJA", dateIn: "2026-09-02", dateDue: "2026-10-02", period: "1 BULAN", rentType: "MONTHLY", rentAmount: 1500000, note: "" }
];

// Data Pemasukan dan Pengeluaran (Halaman 2, 3, dan 4)
const TRANSACTIONS_DATA = [
  // Halaman 2: BSI Faraby & Operasional
  { date: "2026-09-10", type: "INCOME", amount: 1500000, room: "46", desc: "Sewa Kamar 46 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-10", type: "INCOME", amount: 1500000, room: "21", desc: "Sewa Kamar 21 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-10", type: "INCOME", amount: 1500000, room: "48", desc: "Sewa Kamar 48 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-10", type: "INCOME", amount: 200000, room: "43", desc: "DP Sewa Kamar 43 untuk 1 Bulan (500rb sudah TF ke B. Rojak)", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-10", type: "INCOME", amount: 1500000, room: "10", desc: "Sewa Kamar 10 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-10", type: "INCOME", amount: 1500000, room: "55", desc: "Sewa Kamar 55 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },

  { date: "2026-09-12", type: "INCOME", amount: 1500000, room: "41", desc: "Sewa Kamar 41 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-12", type: "EXPENSE", amount: 100000, room: null, desc: "Servis AC", method: "TRANSFER", note: "BSI Faraby" },

  { date: "2026-09-13", type: "INCOME", amount: 1500000, room: "37", desc: "Sewa Kamar 37 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-13", type: "INCOME", amount: 1500000, room: "53", desc: "Sewa Kamar 53 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-13", type: "INCOME", amount: 1500000, room: "45", desc: "Sewa Kamar 45 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },

  { date: "2026-09-14", type: "EXPENSE", amount: 503500, room: null, desc: "Token Listrik Kantor", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-14", type: "EXPENSE", amount: 1500000, room: null, desc: "Bayar Mobil Sedot WC", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-14", type: "INCOME", amount: 1500000, room: "42", desc: "Sewa Kamar 42 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-14", type: "INCOME", amount: 8000000, room: "05", desc: "Sewa Kamar 5 untuk 6 Bulan", method: "TRANSFER", note: "BSI Faraby" },

  { date: "2026-09-15", type: "INCOME", amount: 1500000, room: "44", desc: "Sewa Kamar 44 untuk 1 Bulan", method: "TRANSFER", note: "" },
  { date: "2026-09-17", type: "INCOME", amount: 1500000, room: "11", desc: "Sewa Kamar 11 untuk 1 Bulan", method: "TRANSFER", note: "BSI Faraby" },
  { date: "2026-09-17", type: "EXPENSE", amount: 7500000, room: null, desc: "Transfer ke Rocchi", method: "TRANSFER", note: "Faraby (Dede) ke Rocchi" },

  // Halaman 3: BPD KBS & Operasional
  { date: "2026-09-16", type: "INCOME", amount: 800000, room: "43", desc: "Sisa Pembayaran Sewa Kamar 43 untuk 1 Bulan", method: "TRANSFER", note: "BPD KBS" },
  { date: "2026-09-19", type: "INCOME", amount: 1500000, room: "23", desc: "Sewa Kamar 23 untuk 1 Bulan", method: "TRANSFER", note: "BPD KBS" },
  { date: "2026-09-20", type: "INCOME", amount: 16200000, room: "16", desc: "Pembayaran 12 Kamar Pelayaran untuk 1 Bulan (Kamar 16, 17, 19, 20, 33, 38, 39, 50, 52, 54, 56, 57)", method: "TRANSFER", note: "BPD KBS - Rombongan Pelayaran" },
  { date: "2026-09-21", type: "EXPENSE", amount: 560000, room: null, desc: "Bayar Tagihan WiFi", method: "TRANSFER", note: "BPD KBS" },
  { date: "2026-09-22", type: "INCOME", amount: 1350000, room: "40", desc: "Sewa Kamar 40 untuk 1 Bulan", method: "TRANSFER", note: "BPD KBS - Pelayaran" },
  { date: "2026-09-22", type: "EXPENSE", amount: 320000, room: null, desc: "Bon Sapu, Pel, dan Plastik Sampah", method: "CASH", note: "" },
  { date: "2026-09-22", type: "EXPENSE", amount: 600000, room: null, desc: "Sedot WC", method: "CASH", note: "" },
  { date: "2026-09-22", type: "EXPENSE", amount: 6500, room: null, desc: "Biaya Administrasi Bank", method: "TRANSFER", note: "" },
  { date: "2026-09-24", type: "EXPENSE", amount: 200000, room: "23", desc: "Servis AC Kamar 23 dan 33", method: "CASH", note: "" },
  { date: "2026-09-24", type: "EXPENSE", amount: 6500, room: null, desc: "Biaya Administrasi Bank", method: "TRANSFER", note: "" },
  { date: "2026-09-24", type: "INCOME", amount: 1500000, room: "07", desc: "Sewa Kamar 07 untuk 1 Bulan", method: "TRANSFER", note: "" },
  { date: "2026-09-28", type: "EXPENSE", amount: 200000, room: null, desc: "Pembelian Solar 20 Liter", method: "CASH", note: "" },

  // Halaman 4: Transaksi Operasional & Penyesuaian
  { date: "2026-09-18", type: "INCOME", amount: 7500000, room: null, desc: "Penerimaan Transfer dari Dede (Faraby) ke Rocchi", method: "TRANSFER", note: "Dede (Faraby) ke Rocchi" },
  { date: "2026-09-18", type: "EXPENSE", amount: 350000, room: null, desc: "Bayar Iuran Sampah", method: "CASH", note: "" },
  { date: "2026-09-21", type: "EXPENSE", amount: 500000, room: null, desc: "Isi Token Listrik", method: "CASH", note: "" },
  { date: "2026-09-21", type: "EXPENSE", amount: 400000, room: null, desc: "Pinjaman Rian", method: "CASH", note: "" },
  { date: "2026-09-23", type: "EXPENSE", amount: 600000, room: null, desc: "Beli Mikro Bakteri", method: "CASH", note: "" },
  { date: "2026-09-24", type: "EXPENSE", amount: 1480000, room: null, desc: "Bayar Laundry", method: "CASH", note: "" },
  { date: "2026-09-26", type: "EXPENSE", amount: 100000, room: null, desc: "Pinjaman Rian", method: "CASH", note: "" },
  { date: "2026-09-26", type: "EXPENSE", amount: 100000, room: "03", desc: "Servis AC Kamar 03", method: "CASH", note: "" },
  { date: "2026-09-27", type: "EXPENSE", amount: 1003500, room: null, desc: "Pembelian Token Listrik", method: "CASH", note: "" }
];

async function main() {
  console.log("==================================================");
  console.log("🚀 MEMULAI RESET & SEEDING DATA REAL TERBARU");
  console.log("   (Berdasarkan Laporan Lengkap Lamgugob Faraby / Dede)");
  console.log("==================================================");

  // 1. Bersihkan transaksi dan tenant lama
  console.log("\n🧹 1. Membersihkan data transaksi & penghuni lama...");
  await prisma.transaction.deleteMany();
  await prisma.tenant.deleteMany();
  console.log("   ✔ Database bersih dari data lama.");

  // 2. Siapkan 58 Kamar (01 s/d 58) + Kamar 59 & 60 sebagai Fasilitas
  console.log("\n🏢 2. Mempersiapkan 58 Kamar Kos + Gudang & Kantor...");
  const roomsMap = new Map();

  for (let i = 1; i <= 60; i++) {
    const roomNum = String(i).padStart(2, "0");
    const isSpecialFacility = i === 59 || i === 60;
    const defaultStatus = isSpecialFacility ? "MAINTENANCE" : "AVAILABLE";

    const inventories = isSpecialFacility
      ? [{ item: i === 59 ? "Gudang Bawah" : "Kantor Pengelola", state: "BAIK" }]
      : [
          { item: "Kasur Springbed", state: "BAIK" },
          { item: "AC Daikin 1/2 PK", state: "BAIK" },
          { item: "Smart TV 32 Inch", state: "BAIK" },
          { item: "Lemari Pakaian 2 Pintu", state: "BAIK" },
          { item: "Meja & Kursi Kerja", state: "BAIK" },
          { item: "Water Heater Ariston", state: "BAIK" }
        ];

    const room = await prisma.room.upsert({
      where: { number: roomNum },
      update: {
        status: defaultStatus,
        inventories: inventories
      },
      create: {
        number: roomNum,
        status: defaultStatus,
        inventories: inventories
      }
    });

    roomsMap.set(roomNum, room);
  }
  console.log("   ✔ 60 Kamar & Fasilitas siap di database.");

  // 3. Masukkan Data Penghuni
  console.log("\n👤 3. Memasukkan data penghuni terbaru (50+ data)...");
  const tenantCreatedMap = new Map();
  let tenantCount = 0;

  for (const t of TENANTS_DATA) {
    const room = roomsMap.get(t.room);
    if (!room) continue;

    const dateIn = new Date(`${t.dateIn}T00:00:00.000Z`);
    const dateDue = new Date(`${t.dateDue}T00:00:00.000Z`);

    // Tentukan status aktif / akan jatuh tempo
    const now = new Date("2026-09-30T00:00:00.000Z");
    const diffDays = Math.ceil((dateDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let status = "ACTIVE";
    if (diffDays <= 7 && diffDays >= 0) {
      status = "EXPIRING_SOON";
    }

    const createdTenant = await prisma.tenant.create({
      data: {
        name: t.name,
        phone: "-",
        email: null,
        roomId: room.id,
        status: status as any,
        dateIn: dateIn,
        dateDue: dateDue,
        rentType: t.rentType as any,
        rentAmount: t.rentAmount
      }
    });

    // Update status kamar menjadi OCCUPIED
    await prisma.room.update({
      where: { id: room.id },
      data: { status: "OCCUPIED" }
    });

    // Simpan ke map untuk relasi transaksi
    if (!tenantCreatedMap.has(t.room)) {
      tenantCreatedMap.set(t.room, createdTenant);
    }
    tenantCount++;
  }
  console.log(`   ✔ Berhasil memasukkan ${tenantCount} penghuni riil.`);

  // 4. Masukkan Data Transaksi Keuangan (Pemasukan & Pengeluaran)
  console.log("\n💰 4. Memasukkan seluruh riwayat transaksi (Pemasukan & Pengeluaran)...");
  let txCount = 0;

  for (let idx = 0; idx < TRANSACTIONS_DATA.length; idx++) {
    const tx = TRANSACTIONS_DATA[idx];
    const txDate = new Date(`${tx.date}T12:00:00.000Z`);
    
    let tenantId = null;
    let roomId = null;

    if (tx.room && roomsMap.has(tx.room)) {
      roomId = roomsMap.get(tx.room).id;
      const tenant = tenantCreatedMap.get(tx.room);
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    // Buat Ref ID unik dan representatif
    const dateCode = tx.date.replace(/-/g, "").slice(2);
    const prefix = tx.type === "INCOME" ? "TRX-IN" : "TRX-OUT";
    const refId = `${prefix}-${dateCode}-${String(idx + 1).padStart(3, "0")}`;

    await prisma.transaction.create({
      data: {
        refId,
        type: tx.type as any,
        amount: tx.amount,
        paymentMethod: tx.method as any,
        rentType: tx.type === "INCOME" ? "MONTHLY" : null,
        description: tx.desc + (tx.note ? ` (${tx.note})` : ""),
        tenantId: tenantId,
        roomId: roomId,
        date: txDate,
        createdAt: txDate
      }
    });
    txCount++;
  }
  console.log(`   ✔ Berhasil memasukkan ${txCount} data transaksi keuangan lengkap.`);

  // 5. Cek Ringkasan Akhir
  const finalRooms = await prisma.room.count();
  const finalOccupied = await prisma.room.count({ where: { status: "OCCUPIED" } });
  const finalAvailable = await prisma.room.count({ where: { status: "AVAILABLE" } });
  const finalMaintenance = await prisma.room.count({ where: { status: "MAINTENANCE" } });
  const finalTenants = await prisma.tenant.count();
  const finalTxs = await prisma.transaction.count();

  // Hitung total pemasukan dan pengeluaran
  const incomeAgg = await prisma.transaction.aggregate({
    where: { type: "INCOME" },
    _sum: { amount: true }
  });
  const expenseAgg = await prisma.transaction.aggregate({
    where: { type: "EXPENSE" },
    _sum: { amount: true }
  });

  const totalMasuk = incomeAgg._sum.amount || 0;
  const totalKeluar = expenseAgg._sum.amount || 0;
  const saldoBersih = totalMasuk - totalKeluar;

  console.log("\n==================================================");
  console.log("🎉 SEEDING DATA TERBARU LAMGUGOB BERHASIL 100%!");
  console.log("==================================================");
  console.log(`🏠 Total Kamar             : ${finalRooms}`);
  console.log(`🟢 Kamar Terisi (Occupied) : ${finalOccupied}`);
  console.log(`🟡 Kamar Kosong (Available): ${finalAvailable}`);
  console.log(`🔴 Gudang & Kantor (Maint) : ${finalMaintenance}`);
  console.log(`👤 Total Penghuni          : ${finalTenants}`);
  console.log(`🧾 Total Transaksi         : ${finalTxs}`);
  console.log(`📈 Total Pemasukan         : Rp ${totalMasuk.toLocaleString("id-ID")}`);
  console.log(`📉 Total Pengeluaran       : Rp ${totalKeluar.toLocaleString("id-ID")}`);
  console.log(`💵 Saldo Bersih            : Rp ${saldoBersih.toLocaleString("id-ID")}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Error running seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
