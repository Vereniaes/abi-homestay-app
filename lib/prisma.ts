import { PrismaClient } from "@prisma/client";

// helper --------------------------------------------------------------------------
// function untuk menyaring & memastikan URI MongoDB Atlas selalu menyertakan nama database 'abi-homestay'
// input param : none
// output : string URL database yang telah disanitasi
// end of helper ------------------------------------------------------------------
function getSanitizedDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb+srv://Vercel-Admin-abi-homestay-database:kkwDBHUOc8NFDvQP@abi-homestay-database.x7sw9vu.mongodb.net/abi-homestay?retryWrites=true&w=majority";

  if (url.includes(".mongodb.net/?")) {
    url = url.replace(".mongodb.net/?", ".mongodb.net/abi-homestay?");
  } else if (url.includes(".mongodb.net?")) {
    url = url.replace(".mongodb.net?", ".mongodb.net/abi-homestay?");
  } else if (url.endsWith(".mongodb.net") || url.endsWith(".mongodb.net/")) {
    url = url.replace(/\.mongodb\.net\/?$/, ".mongodb.net/abi-homestay");
  }

  return url;
}

// helper --------------------------------------------------------------------------
// function untuk menginisialisasi singleton PrismaClient pada Next.js Serverless
// input param : none
// output : instance PrismaClient
// end of helper ------------------------------------------------------------------
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getSanitizedDatabaseUrl(),
      },
    },
    log: ["error"],
  });

globalForPrisma.prisma = prisma;
