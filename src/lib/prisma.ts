import {
  PrismaClient,
  PrismaClientOptions,
} from '../../generated/prisma/client';

const prismaOptions: PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

const prisma = new PrismaClient(prismaOptions);
export default prisma;
