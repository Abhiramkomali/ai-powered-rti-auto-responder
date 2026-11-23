
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import styles from "./requests.module.css";

const officerRoles = new Set([
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
]);

export default async function OfficerRequestsPage() {

  await connection();

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        select: {
          department: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive || !officerRoles.has(user.role)) {
    redirect("/login");
  }

  // Platform administrators can inspect all departments.
  // Other officers can access only their active memberships.
  const visibleDepartments =
    user.role === "PLATFORM_ADMIN"
      ? await prisma.department.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : user.memberships.map((membership) => membership.department);

  const departmentIds = visibleDepartments.map(
    (department) => department.id,
  );

  // Never retrieve requests outside the user's authorized departments.
  const requests =
    departmentIds.length > 0
      ? await prisma.rtiRequest.findMany({
          where: {
            departmentId: { in: departmentIds },
          },
          orderBy: { submittedAt: "desc" },
          take: 100,
          select: {
            id: true,
            referenceNumber: true,
            fullName: true,
            email: true,
            mobile: true,
            address: true,
            state: true,
            district: true,
            pinCode: true,
            departmentId: true,
            subject: true,
            description: true,
            dateFrom: true,
            dateTo: true,
            responseFormat: true,
            status: true,
            submittedAt: true,
          },
        })
      : [];

  const departmentNames = new Map(
    visibleDepartments.map((department) => [
      department.id,
      department.name,
    ]),
  );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Soochna · Officer portal</span>
          <h1 className={styles.title}>Request workspace</h1>
          <p className={styles.description}>
            Review RTI requests submitted to your authorized departments.
          </p>
        </div>

        <span className={styles.count}>
          {requests.length} request{requests.length === 1 ? "" : "s"}
        </span>
      </header>

      <section aria-label="Authorized departments">
        <div className={styles.departmentList}>
          {visibleDepartments.map((department) => (
            <span className={styles.department} key={department.id}>
              {department.name}
            </span>
          ))}
        </div>
      </section>

      {requests.length === 0 ? (
        <section className={styles.empty}>
          <h2>No requests available</h2>
          <p>
            {visibleDepartments.length === 0
              ? "Your account has no active department memberships. Contact the platform administrator for access."
              : "There are currently no RTI requests in your authorized departments."}
          </p>
        </section>
      ) : (
        <section className={styles.requestList} aria-label="RTI requests">
          {requests.map((request) => (
            <article className={styles.requestCard} key={request.id}>
              <div className={styles.requestTop}>
                <div>
                  <span className={styles.reference}>
                    {request.referenceNumber}
                  </span>
                  <h2 className={styles.subject}>{request.subject}</h2>
                </div>

                <span className={styles.status}>
                  {request.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className={styles.meta}>
                <span>
                  {departmentNames.get(request.departmentId) ??
                    request.departmentId}
                </span>
                <span>Applicant: {request.fullName}</span>
                <span>
                  Submitted: {request.submittedAt.toLocaleDateString("en-IN")}
                </span>
              </div>

              <details className={styles.details}>
                <summary>View request details</summary>

                <div className={styles.detailsContent}>
                  <div>
                    <span className={styles.detailLabel}>
                      Applicant email
                    </span>
                    <p className={styles.detailValue}>{request.email}</p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>
                      Mobile number
                    </span>
                    <p className={styles.detailValue}>{request.mobile}</p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>
                      Applicant address
                    </span>
                    <p className={styles.detailValue}>
                      {request.address}, {request.district}, {request.state} -{" "}
                      {request.pinCode}
                    </p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>
                      Information requested
                    </span>
                    <p className={styles.detailValue}>
                      {request.description}
                    </p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>
                      Requested information period
                    </span>
                    <p className={styles.detailValue}>
                      {request.dateFrom
                        ? request.dateFrom.toLocaleDateString("en-IN")
                        : "Not specified"}
                      {" – "}
                      {request.dateTo
                        ? request.dateTo.toLocaleDateString("en-IN")
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <span className={styles.detailLabel}>
                      Preferred response format
                    </span>
                    <p className={styles.detailValue}>
                      {request.responseFormat}
                    </p>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
