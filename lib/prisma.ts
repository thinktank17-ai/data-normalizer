/**
 * Prisma client setup with libsql adapter.
 * For local dev: file-based SQLite via DATABASE_URL.
 * For Vercel: set DATABASE_URL to a Turso remote URL or leave blank to skip persistence.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // Support both file: paths and remote turso URLs
  const adapter = new PrismaLibSql({ url: rawUrl });
  return new PrismaClient({ adapter });
}

let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (prismaInstance) return prismaInstance;
  prismaInstance = createPrisma();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
  return prismaInstance;
}

export const prisma = getPrisma();
