import { prisma } from "../config/prisma";
import { RbacService } from "../services/rbac.service";

async function main() {
  await prisma.$connect();
  await RbacService.seedGlobalPermissions();
  console.log("Seeded global permissions");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
