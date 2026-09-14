import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  const rooms = await prisma.room.findMany({
    include: { tenants: true }
  });
  
  let mismatchedRooms = 0;
  for (const room of rooms) {
    const activeTenants = room.tenants.filter(t => t.status !== 'INACTIVE').length;
    if (activeTenants > 0 && room.status !== 'OCCUPIED') {
      console.log(`Room ${room.number} has ${activeTenants} active tenants but status is ${room.status}`);
      mismatchedRooms++;
    } else if (activeTenants === 0 && room.status === 'OCCUPIED') {
      console.log(`Room ${room.number} has NO active tenants but status is ${room.status}`);
      mismatchedRooms++;
    }
  }
  console.log(`Total mismatched rooms: ${mismatchedRooms}`);
}

test().catch(console.error).finally(() => prisma.$disconnect());
