import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { RbacService } from "./services/rbac.service";
import { Prisma } from "@prisma/client";

const STARTUP_DB_MAX_RETRIES = 6;
const STARTUP_DB_RETRY_DELAY_MS = 3_000;

function isRetryableStartupDbError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017"].includes(error.code);
  }

  if (error instanceof Error) {
    return /can't reach database server|server has closed the connection|connection reset|timeout/i.test(
      error.message,
    );
  }

  return false;
}

async function connectDatabaseWithRetry() {
  for (let attempt = 1; attempt <= STARTUP_DB_MAX_RETRIES; attempt += 1) {
    try {
      await prisma.$connect();
      if (attempt > 1) {
        console.warn(
          `[bootstrap] database connected on retry ${attempt}/${STARTUP_DB_MAX_RETRIES}`,
        );
      }
      return;
    } catch (error) {
      if (!isRetryableStartupDbError(error) || attempt === STARTUP_DB_MAX_RETRIES) {
        throw error;
      }

      console.warn(
        `[bootstrap] database connection failed (attempt ${attempt}/${STARTUP_DB_MAX_RETRIES}); retrying in ${STARTUP_DB_RETRY_DELAY_MS}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, STARTUP_DB_RETRY_DELAY_MS));
    }
  }
}

async function bootstrap() {
  await connectDatabaseWithRetry();
  await RbacService.seedGlobalPermissions();

  app.listen(env.PORT, () => {
    console.log(`Consultease backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap", error);
  if (
    typeof env.DATABASE_URL === "string" &&
    env.DATABASE_URL.includes("neon.tech")
  ) {
    console.error(
      "Neon hint: use the Neon Prisma connection string (sslmode=require), avoid channel_binding=require, and verify IPv4 connectivity to the Neon host from this machine.",
    );
  }
  process.exit(1);
});
