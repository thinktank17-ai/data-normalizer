import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  const dbPath = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = dbPath.startsWith("file:") ? dbPath.slice(5) : dbPath;
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const adapter = new PrismaLibSql({
    url: `file:${absolutePath}`,
  });

  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
