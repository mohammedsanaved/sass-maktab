// // src/lib/prisma.ts
// import { PrismaClient } from '@/generated/prisma/client';

// const prismaClientSingleton = () => {
//   return new PrismaClient({});
// };

// declare global {
//   // This must use "var", not "let" or "const"
//   // Also ensure the type matches your PrismaClient
//   var prismaGlobal: PrismaClient | undefined;
// }

// const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// export default prisma;

// // Prevents multiple instances during dev (Next.js hot reload)
// if (process.env.NODE_ENV !== 'production') {
//   globalThis.prismaGlobal = prisma;
// }

import { PrismaClient } from '@/generated/prisma/client';

const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
