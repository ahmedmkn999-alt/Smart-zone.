import { PrismaClient } from "@prisma/client";

// Prisma queries are parameterized under the hood, which is what actually
// prevents SQL injection — never build queries with raw string concatenation
// ($queryRawUnsafe / string-built SQL). Stick to the query builder or
// $queryRaw with tagged templates everywhere in this project.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
