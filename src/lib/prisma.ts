
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as SqlitePrismaClient } from "../generated/prisma/client";
import { PrismaClient as PostgresPrismaClient } from "../generated/postgresql/client";

type AppPrismaClient = SqlitePrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};

function createPrismaClient(): AppPrismaClient {
  if (process.env.DATABASE_PROVIDER === "postgresql") {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL.");
    const adapter = new PrismaPg({ connectionString });
    return new PostgresPrismaClient({ adapter }) as unknown as AppPrismaClient;
  }

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  return new SqlitePrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

