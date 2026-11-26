import { loadEnvConfig } from "@next/env";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();


async function main() {
  const email = process.env.TEST_OFFICER_EMAIL?.trim().toLowerCase();
  const password = process.env.TEST_OFFICER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set TEST_OFFICER_EMAIL and TEST_OFFICER_PASSWORD first.",
    );
  }

  if (password.length < 12) {
    throw new Error("Test password must contain at least 12 characters.");
  }

  const passwordHash = await hash(password, 12);

  const officer = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Test PIO Officer",
      passwordHash,
      role: "PIO",
      isActive: true,
    },
    create: {
      name: "Test PIO Officer",
      email,
      passwordHash,
      role: "PIO",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log("Test officer account created or updated:");
  console.log(officer);
}

main()
  .catch((error) => {
    console.error("Failed to create test officer:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
