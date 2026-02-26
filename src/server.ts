import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { RbacService } from "./services/rbac.service";

async function bootstrap() {
  await prisma.$connect();
  await RbacService.seedGlobalPermissions();

  app.listen(env.PORT, () => {
    console.log(`Consultease backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap", error);
  process.exit(1);
});
