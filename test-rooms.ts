import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  const totalRooms = await prisma.room.count();
  const occupiedCount = await prisma.room.count({ where: { status: "OCCUPIED" } });
  const availableCount = await prisma.room.count({ where: { status: "AVAILABLE" } });
  const maintenanceCount = await prisma.room.count({ where: { status: "MAINTENANCE" } });
  console.log({ totalRooms, occupiedCount, availableCount, maintenanceCount });
}

test().catch(console.error).finally(() => prisma.$disconnect());
