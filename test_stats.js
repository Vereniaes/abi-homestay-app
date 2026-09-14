const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getDashboardStats() {
  try {
    const [
      totalRooms,
      occupiedCount,
      availableCount,
      maintenanceCount,
      dueTenants,
      maintenanceRoomsList,
      tenants,
      transactions,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.room.count({ where: { status: "AVAILABLE" } }),
      prisma.room.count({ where: { status: "MAINTENANCE" } }),
      prisma.tenant.findMany({
        where: { status: "EXPIRING_SOON" },
        include: { room: true },
        take: 5,
      }),
      prisma.room.findMany({
        where: { status: "MAINTENANCE" },
        take: 5,
      }),
      prisma.tenant.findMany({
        select: { dateIn: true, dateDue: true, status: true },
      }),
      prisma.transaction.findMany({
        where: { type: "INCOME" },
        select: { date: true, amount: true },
      }),
    ]);
    console.log("Success");
    return {
      totalRooms,
      occupiedCount,
      availableCount,
      maintenanceCount,
      dueTenants: dueTenants.length,
      maintenanceRoomsList: maintenanceRoomsList.length
    }
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
  } finally {
    await prisma.$disconnect();
  }
}
getDashboardStats().then(console.log);
