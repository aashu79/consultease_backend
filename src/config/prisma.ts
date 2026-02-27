import { Prisma, PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const RETRYABLE_READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const RETRYABLE_PRISMA_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server was reached but timed out
  "P1017", // Server has closed the connection
]);

function isRetryableConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (RETRYABLE_PRISMA_ERROR_CODES.has(error.code)) {
      return true;
    }

    return /server has closed the connection/i.test(error.message);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return /connection|socket|econnreset|closed/i.test(error.message);
  }

  if (error instanceof Error) {
    return /connection|socket|econnreset|server has closed the connection/i.test(error.message);
  }

  return false;
}

async function reconnectPrismaClient() {
  try {
    await basePrisma.$disconnect();
  } catch {
    // Ignore disconnect failures; connect can still recover.
  }
  await basePrisma.$connect();
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!RETRYABLE_READ_OPERATIONS.has(operation) || !isRetryableConnectionError(error)) {
            throw error;
          }

          console.warn(`[prisma] transient connection failure on ${operation}; reconnecting and retrying once`);
          await reconnectPrismaClient();
          return query(args);
        }
      },
    },
  },
});
