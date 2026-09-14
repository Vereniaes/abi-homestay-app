import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const dueTenants = await prisma.tenant.findMany({
    where: {
      status: { not: "INACTIVE" },
      dateDue: { lte: nextWeek },
    },
    include: { room: true },
  });

  console.log("Due Tenants:", dueTenants);

  const allTenants = await prisma.tenant.findMany({
    where: { status: { not: "INACTIVE" } },
    select: { id: true, name: true, dateDue: true, status: true }
  });
  console.log("All Active Tenants:", allTenants);
}

test().catch(console.error).finally(() => prisma.$disconnect());
