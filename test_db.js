const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const total = await prisma.room.count();
    console.log("Total rooms:", total);
    
    // Check if Tenant status "EXPIRING_SOON" is valid
    const due = await prisma.tenant.findMany({
      where: { status: "EXPIRING_SOON" }
    });
    console.log("Due tenants:", due.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
