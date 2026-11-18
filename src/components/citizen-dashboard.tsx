import type { ReactNode } from "react";
import Link from "next/link";

import type { RequestStatus } from "@/lib/domain/requests";
import type { RtiRequestSummary } from "@/lib/contracts/api";

const demoApplications: readonly RtiRequestSummary[] = [
  {
    id: "demo-request-2026-041",
    referenceNumber: "RTI/DEMO/2026/0041",
    status: "UNDER_REVIEW",
    subject: "Details of road repair works in Ward 18",
    departmentId: "public-works",
    submittedAt: "2026-10-28T10:30:00.000Z",
    deadline: null,
  },
  {
    id: "demo-request-2026-038",
    referenceNumber: "RTI/DEMO/2026/0038",
    status: "SUBMITTED",
    subject: "Public library opening hours and facilities",
    departmentId: "public-libraries",
    submittedAt: "2026-10-24T08:15:00.000Z",
    deadline: null,
  },
  {
    id: "demo-request-2026-033",
    referenceNumber: "RTI/DEMO/2026/0033",
    status: "AWAITING_FEE",
    subject: "Copies of property tax assessment records",
    departmentId: "revenue",
    submittedAt: "2026-10-19T12:00:00.000Z",
    deadline: null,
  },
  {
    id: "demo-request-2026-027",
    referenceNumber: "RTI/DEMO/2026/0027",
    status: "RESPONSE_ISSUED",
    subject: "Streetlight maintenance schedule for Sector 4",
    departmentId: "public-works",
    submittedAt: "2026-10-12T06:45:00.000Z",
    deadline: null,
  },
  {
    id: "demo-request-2026-019",
    referenceNumber: "RTI/DEMO/2026/0019",
    status: "DRAFTING_RESPONSE",
    subject: "Municipal school sanitation inspection reports",
    departmentId: "education",
    submittedAt: "2026-10-06T09:20:00.000Z",
    deadline: null,
  },
  {
    id: "demo-request-2026-012",
    referenceNumber: "RTI/DEMO/2026/0012",
    status: "CLOSED",
    subject: "Drinking water quality test summaries",
    departmentId: "water-supply",
    submittedAt: "2026-09-29T11:10:00.000Z",
    deadline: null,
  },
];

const departmentNames: Record<string, string> = {
  "public-works": "Public Works Department",
  "public-libraries": "Public Libraries",
  revenue: "Revenue Department",
  education: "Education Department",
  "water-supply": "Water Supply Department",
};

const statusLabels = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  ROUTING: "Being routed",
  ASSIGNED: "Assigned",
  UNDER_REVIEW: "Under review",
  AWAITING_FEE: "Fee requested",
  AWAITING_THIRD_PARTY: "Third-party consultation",
  TRANSFERRED: "Transferred",
  DRAFTING_RESPONSE: "Response in progress",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  RESPONSE_ISSUED: "Response received",
  CLOSED: "Closed",
  WITHDRAWN: "Withdrawn",
} satisfies Record<RequestStatus, string>;

const statusClasses = {
  DRAFT: "status-badge--neutral",
  SUBMITTED: "status-badge--blue",
  ROUTING: "status-badge--blue",
  ASSIGNED: "status-badge--blue",
  UNDER_REVIEW: "status-badge--gold",
  AWAITING_FEE: "status-badge--gold",
  AWAITING_THIRD_PARTY: "status-badge--gold",
  TRANSFERRED: "status-badge--blue",
  DRAFTING_RESPONSE: "status-badge--gold",
  AWAITING_APPROVAL: "status-badge--gold",
  APPROVED: "status-badge--green",
  RESPONSE_ISSUED: "status-badge--green",
  CLOSED: "status-badge--neutral",
  WITHDRAWN: "status-badge--neutral",
} satisfies Record<RequestStatus, string>;

const pendingStatuses: readonly RequestStatus[] = [
  "SUBMITTED",
  "ROUTING",
  "ASSIGNED",
  "AWAITING_FEE",
  "AWAITING_THIRD_PARTY",
  "TRANSFERRED",
  "DRAFTING_RESPONSE",
  "AWAITING_APPROVAL",
];

type ApplicationListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; applications: readonly RtiRequestSummary[] };

const applicationListState: ApplicationListState = {
  kind: "ready",
  applications: demoApplications,
};

const navigationItems = [
  { href: "/citizen/dashboard", label: "Overview", icon: "overview" },
  { href: "/citizen/submit", label: "Submit RTI Request", icon: "submit" },
  { href: "/citizen/track", label: "Track Application", icon: "track" },
  { href: "/citizen/dashboard#applications", label: "My Applications", icon: "applications" },
  { href: "/citizen/dashboard#profile", label: "Profile", icon: "profile" },
] as const;

type IconName =
  | "overview"
  | "submit"
  | "track"
  | "applications"
  | "profile"
  | "logout"
  | "arrow"
  | "file"
  | "clock"
  | "search"
  | "check";

function Icon({ name }: { name: IconName }) {
  const paths = {
    overview: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      </>
    ),
    submit: (
      <>
        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
        <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
      </>
    ),
    track: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 9.5h16m-11 4h6m-6 3h4" />
      </>
    ),
    applications: (
      <>
        <path d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v13H4.5V6A1.5 1.5 0 0 1 6 4.5Z" />
        <path d="M8 9h8m-8 4h8m-8 4h5" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20v-1.6a6.5 6.5 0 0 1 13 0V20h-13Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5.5v14H10m5-3 4-4-4-4m4 4H9" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    file: (
      <>
        <path d="M13.5 3.5H6A1.5 1.5 0 0 0 4.5 5v14A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5V9.5l-6-6Z" />
        <path d="M13 4v6h6m-10 4h6m-6 3h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.4 15.4 4.1 4.1" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  } satisfies Record<IconName, ReactNode>;

  return (
    <svg
      aria-hidden="true"
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="dashboard-brand-mark" aria-hidden="true">
      <svg fill="none" viewBox="0 0 32 32">
        <path
          d="M7.5 5.75h11l6 6v14.5h-17V5.75Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M18.5 5.75v6h6M11.5 17h9M11.5 21h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="23.5" cy="23.5" r="4.25" fill="#d2a44c" stroke="#102a43" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" href="/" aria-label="Soochna home">
        <BrandMark />
        <span className="dashboard-brand-copy">
          <span className="dashboard-brand-name">Soochna</span>
          <span className="dashboard-brand-caption">Citizen portal</span>
        </span>
      </Link>

      <div className="dashboard-sidebar-label">WORKSPACE</div>
      <nav className="dashboard-navigation" aria-label="Citizen dashboard">
        {navigationItems.map((item, index) => (
          <Link
            aria-current={index === 0 ? "page" : undefined}
            className={`dashboard-nav-link${index === 0 ? " dashboard-nav-link--active" : ""}`}
            href={item.href}
            key={item.label}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="dashboard-sidebar-bottom">
        <div className="dashboard-sidebar-note">
          <span className="dashboard-note-mark" aria-hidden="true">i</span>
          <p>Demonstration portal. No official application is being processed.</p>
        </div>
        <button
          aria-disabled="true"
          className="dashboard-nav-link dashboard-logout"
          title="Logout is unavailable in this demonstration"
          type="button"
        >
          <Icon name="logout" />
          <span>Logout</span>
          <span className="dashboard-placeholder-tag">Demo</span>
        </button>
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: IconName;
  tone: "navy" | "gold" | "blue" | "green";
}) {
  return (
    <article className="dashboard-stat-card">
      <div className={`dashboard-stat-icon dashboard-stat-icon--${tone}`}>
        <Icon name={icon} />
      </div>
      <span className="dashboard-stat-label">{label}</span>
      <strong className="dashboard-stat-value">{value}</strong>
      <span className="dashboard-stat-detail">{detail}</span>
    </article>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`status-badge ${statusClasses[status]}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

function ApplicationTable({ state }: { state: ApplicationListState }) {
  if (state.kind === "loading") {
    return (
      <div aria-busy="true" className="dashboard-table-state" role="status">
        <span className="dashboard-loading-indicator" />
        <span>Loading your demonstration applications…</span>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="dashboard-table-state dashboard-table-state--error" role="alert">
        <span className="dashboard-state-symbol" aria-hidden="true">!</span>
        <div>
          <strong>Applications could not be displayed</strong>
          <p>{state.message}</p>
          <Link href="/citizen/dashboard">Return to dashboard</Link>
        </div>
      </div>
    );
  }

  if (state.applications.length === 0) {
    return (
      <div className="dashboard-table-state">
        <span className="dashboard-empty-icon"><Icon name="search" /></span>
        <strong>No applications yet</strong>
        <p>Your submitted requests will appear here.</p>
        <Link className="button button--navy button--small" href="/citizen/submit">
          Start an RTI request
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-table-scroll">
      <table className="dashboard-applications-table">
        <thead>
          <tr>
            <th scope="col">Application</th>
            <th scope="col">Submitted</th>
            <th scope="col">Department</th>
            <th scope="col">Current status</th>
            <th scope="col"><span className="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {state.applications.map((application) => (
            <tr key={application.id}>
              <td>
                <span className="application-reference">{application.referenceNumber}</span>
                <span className="application-subject">{application.subject}</span>
              </td>
              <td className="application-date">
                {new Intl.DateTimeFormat("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(application.submittedAt))}
              </td>
              <td className="application-department">
                {departmentNames[application.departmentId] ?? "Public authority"}
              </td>
              <td><StatusBadge status={application.status} /></td>
              <td>
                <Link
                  aria-label={`View details for ${application.referenceNumber}`}
                  className="application-view-link"
                  href={`/citizen/track?reference=${encodeURIComponent(application.referenceNumber)}`}
                >
                  View <Icon name="arrow" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getApplicationCounts(applications: readonly RtiRequestSummary[]) {
  return {
    total: applications.length,
    pending: applications.filter((application) =>
      pendingStatuses.includes(application.status),
    ).length,
    underReview: applications.filter(
      (application) => application.status === "UNDER_REVIEW",
    ).length,
    responses: applications.filter(
      (application) =>
        application.status === "RESPONSE_ISSUED" || application.status === "CLOSED",
    ).length,
  };
}

export function CitizenDashboard() {
  const applications =
    applicationListState.kind === "ready" ? applicationListState.applications : [];
  const counts = getApplicationCounts(applications);

  return (
    <div className="citizen-dashboard">
      <DashboardSidebar />
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            Citizen services <span aria-hidden="true">/</span> <strong>Overview</strong>
          </div>
          <a className="dashboard-user" href="#profile">
            <span className="dashboard-avatar" aria-hidden="true">C</span>
            <span className="dashboard-user-copy">
              <strong>Citizen</strong>
              <span>Demonstration profile</span>
            </span>
          </a>
        </header>

        <div className="dashboard-content">
          <section aria-labelledby="dashboard-welcome-title" className="dashboard-welcome">
            <div className="dashboard-welcome-copy">
              <span className="dashboard-eyebrow">CITIZEN WORKSPACE</span>
              <h1 id="dashboard-welcome-title">Welcome to your dashboard</h1>
              <p>Keep track of your information requests and their latest updates.</p>
            </div>
            <Link className="button button--navy dashboard-submit-button" href="/citizen/submit">
              <Icon name="submit" />
              Submit New RTI Request
            </Link>
          </section>

          <div className="dashboard-demo-notice" role="note">
            <span className="dashboard-demo-notice-icon" aria-hidden="true">i</span>
            <p>
              <strong>Demonstration data:</strong> The applications and figures below are fictional
              examples. This portal does not submit or process actual government applications.
            </p>
          </div>

          <section aria-label="Application summary" className="dashboard-stats">
            <StatCard
              detail="Across this demo account"
              icon="file"
              label="Total RTI requests"
              tone="navy"
              value={counts.total}
            />
            <StatCard
              detail="Awaiting the next step"
              icon="clock"
              label="Pending requests"
              tone="gold"
              value={counts.pending}
            />
            <StatCard
              detail="Currently being examined"
              icon="search"
              label="Under review"
              tone="blue"
              value={counts.underReview}
            />
            <StatCard
              detail="Response issued or completed"
              icon="check"
              label="Responses received"
              tone="green"
              value={counts.responses}
            />
          </section>

          <section
            aria-labelledby="applications-title"
            className="dashboard-applications-card"
            id="applications"
          >
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-section-kicker">YOUR ACTIVITY</span>
                <h2 id="applications-title">Recent applications</h2>
                <p>Review reference numbers, departments, and the latest status.</p>
              </div>
              <Link className="dashboard-all-link" href="/citizen/track">
                Track an application <Icon name="arrow" />
              </Link>
            </div>
            <ApplicationTable state={applicationListState} />
            <div className="dashboard-table-footnote">
              Showing {applications.length} fictional demonstration applications
            </div>
          </section>

          <section className="dashboard-profile-card" id="profile">
            <span className="dashboard-profile-icon"><Icon name="profile" /></span>
            <div>
              <span className="dashboard-section-kicker">PROFILE</span>
              <h2>Demonstration citizen</h2>
              <p>Account details and profile management are not available in this prototype.</p>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>Soochna · Citizen services demonstration</span>
            <Link href="/">Return to Soochna home <Icon name="arrow" /></Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
