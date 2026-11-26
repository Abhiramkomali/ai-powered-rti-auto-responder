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

  const publicWorks = await prisma.department.findUnique({
    where: { id: "public-works" },
  });
  if (publicWorks) {
    const demonstrationRecords = [
      ["PWD-DEMO-001", "Road construction project register", "Fictional road construction project register used only for demonstrations.", "Project register", "Document reference"],
      ["PWD-DEMO-002", "Road repair work register", "Fictional register of routine road repair work used only for demonstrations.", "Maintenance", "Document reference"],
      ["PWD-DEMO-003", "Project cost estimate register", "Fictional project estimate reference. No actual public expenditure is represented.", "Cost estimate", "Document reference"],
      ["PWD-DEMO-004", "Expenditure report sample", "Fictional expenditure report metadata for prototype testing.", "Expenditure", "Report"],
      ["PWD-DEMO-005", "Work order register", "Fictional work-order metadata for prototype testing.", "Work order", "Register"],
      ["PWD-DEMO-006", "Contractor award record sample", "Fictional contractor award metadata. This record is not an actual award notice.", "Contract award", "Notice metadata"],
      ["PWD-DEMO-007", "Project completion certificate sample", "Fictional completion-certificate metadata used only for the demonstration.", "Completion", "Certificate metadata"],
      ["PWD-DEMO-008", "Project progress report sample", "Fictional quarterly progress report metadata used only for demonstrations.", "Progress", "Progress report"],
      ["PWD-DEMO-009", "Pending maintenance register", "Fictional pending-maintenance request metadata used only for demonstrations.", "Maintenance", "Register"],
    ] as const;

    for (const [referenceNumber, title, description, category, documentType] of demonstrationRecords) {
      await prisma.departmentRecord.upsert({
        where: {
          departmentId_referenceNumber: {
            departmentId: publicWorks.id,
            referenceNumber,
          },
        },
        update: { title, description, category, documentType },
        create: {
          departmentId: publicWorks.id,
          title,
          description,
          category,
          referenceNumber,
          documentType,
          storageReference: "DEMO-ONLY/fictional-record-metadata",
          isDemo: true,
        },
      });
    }
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
