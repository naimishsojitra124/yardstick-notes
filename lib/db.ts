import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line
  var prisma: PrismaClient | undefined;
}

const client = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = client;

export default client;
