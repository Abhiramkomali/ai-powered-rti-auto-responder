import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient();

const departments = [
  { id: "public-works", name: "Public Works Department" },
  { id: "education", name: "Education Department" },
  { id: "health", name: "Health Department" },
  { id: "revenue", name: "Revenue Department" },
  {
    id: "municipal-administration",
    name: "Municipal Administration",
  },
  { id: "transport", name: "Transport Department" },
];

async function main() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: { name: department.name },
      create: department,
    });
  }

  console.log("Successfully seeded all departments.");
}

main()
  .catch((error) => {
    console.error("Department seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
