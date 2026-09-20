const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [total, occ, avail, maint, tenants] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: 'OCCUPIED' } }),
    prisma.room.count({ where: { status: 'AVAILABLE' } }),
    prisma.room.count({ where: { status: 'MAINTENANCE' } }),
    prisma.tenant.count({ where: { status: { not: 'INACTIVE' } } })
  ]);

  console.log({
    total,
    occ,
    avail,
    maint,
    tenants,
    sum: occ + avail + maint
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
