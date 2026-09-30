import { prisma } from "../lib/prisma";
import { getDashboardStats, getRooms, getTenants, getTransactions, getPricingAndSettings } from "../app/actions";

async function runFullAudit() {
  console.log("=== MEMULAI AUTOMATION TESTING & AUDIT DATA REAL ===");
  const auditReport: { [key: string]: any } = {
    checks: [],
    errors: [],
    warnings: [],
  };

  try {
    // 1. Audit Database Collections
    console.log("\n[1] Memeriksa Integritas Database...");
    const [roomCount, tenantCount, activeTenantCount, txCount, userCount, pricing, setting] = await Promise.all([
      prisma.room.count(),
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count(),
      prisma.user.count(),
      prisma.pricing.findFirst(),
      prisma.setting.findFirst(),
    ]);

    auditReport.database = {
      totalRooms: roomCount,
      totalTenants: tenantCount,
      activeTenants: activeTenantCount,
      totalTransactions: txCount,
      totalUsers: userCount,
      hasPricing: !!pricing,
      hasSetting: !!setting,
    };
    console.log("-> DB Counts:", JSON.stringify(auditReport.database, null, 2));

    // 2. Audit Relasi Tenant -> Room
    console.log("\n[2] Memeriksa Relasi Data Penghuni & Kamar...");
    const allTenants = await prisma.tenant.findMany({
      include: { room: true },
    });

    let orphanTenants = 0;
    let missingDueDate = 0;
    let tenantsWithEmail = 0;

    for (const t of allTenants) {
      if (!t.room) {
        orphanTenants++;
        auditReport.errors.push(`Tenant ${t.name} (ID: ${t.id}) tidak memiliki relasi kamar.`);
      }
      if (!t.dateDue && t.status === "ACTIVE") {
        missingDueDate++;
        auditReport.warnings.push(`Tenant aktif ${t.name} (Kamar ${t.room?.number}) belum memiliki tanggal jatuh tempo.`);
      }
      if (t.email) {
        tenantsWithEmail++;
      }
    }
    console.log(`-> Total Penghuni: ${allTenants.length}`);
    console.log(`-> Penghuni Tanpa Kamar: ${orphanTenants}`);
    console.log(`-> Penghuni Aktif Tanpa Jatuh Tempo: ${missingDueDate}`);
    console.log(`-> Penghuni dengan Email: ${tenantsWithEmail}`);

    // 3. Audit Relasi Transaksi
    console.log("\n[3] Memeriksa Relasi Transaksi...");
    const allTransactions = await prisma.transaction.findMany({
      include: { tenant: true, room: true },
    });

    let invalidAmounts = 0;
    let missingRefIds = 0;

    for (const tx of allTransactions) {
      if (typeof tx.amount !== "number" || isNaN(tx.amount) || tx.amount <= 0) {
        invalidAmounts++;
        auditReport.warnings.push(`Transaksi Ref: ${tx.refId} memiliki nominal tidak valid: ${tx.amount}`);
      }
      if (!tx.refId) {
        missingRefIds++;
        auditReport.errors.push(`Transaksi ID: ${tx.id} tidak memiliki Ref ID.`);
      }
    }
    console.log(`-> Total Transaksi: ${allTransactions.length}`);
    console.log(`-> Transaksi Nominal Tidak Valid: ${invalidAmounts}`);
    console.log(`-> Transaksi Tanpa Ref ID: ${missingRefIds}`);

    // 4. Test Server Actions
    console.log("\n[4] Pengujian Server Actions...");
    const [statsResult, roomsResult, tenantsResult, txResult, priceSettingResult] = await Promise.all([
      getDashboardStats(),
      getRooms(),
      getTenants(),
      getTransactions(),
      getPricingAndSettings(),
    ]);

    console.log("-> getDashboardStats OK:", {
      totalRooms: statsResult.totalRooms,
      occupied: statsResult.occupiedCount,
      available: statsResult.availableCount,
      occupancyRate: statsResult.occupancyRate,
      dueTenantsCount: statsResult.dueTenants?.length,
    });
    console.log("-> getRooms OK, total:", roomsResult.length);
    console.log("-> getTenants OK, total:", tenantsResult.length);
    console.log("-> getTransactions OK, total:", txResult.length);
    console.log("-> getPricingAndSettings OK");

    console.log("\n=== RINGKASAN HASIL AUDIT ===");
    console.log("Status: SELESAI");
    console.log("Total Error Fatal:", auditReport.errors.length);
    console.log("Total Warning Ringan:", auditReport.warnings.length);
    if (auditReport.errors.length > 0) {
      console.log("Errors:", auditReport.errors);
    }
    if (auditReport.warnings.length > 0) {
      console.log("Warnings:", auditReport.warnings);
    }
  } catch (err: any) {
    console.error("FATAL AUDIT ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runFullAudit();
