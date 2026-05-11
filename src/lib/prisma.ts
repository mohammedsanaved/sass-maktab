// import {
//   PrismaClient,
//   PrismaClientOptions,
// } from '../../generated/prisma/client';

// const prismaOptions: PrismaClientOptions = {
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
// };

// const prisma = new PrismaClient(prismaOptions);
// export default prisma;
import { PrismaClient } from '@prisma/client';

// Use a global variable to prevent multiple instances of Prisma Client 
// in development (prevents "Too many connections" errors in MongoDB)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;