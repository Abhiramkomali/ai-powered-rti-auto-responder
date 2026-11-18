import type { ReactNode } from "react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type IconName =
  | "submit"
  | "classify"
  | "search"
  | "draft"
  | "track"
  | "review"
  | "citizen"
  | "officer";

function Icon({ name }: { name: IconName }) {
  const paths = {
    submit: (
      <>
        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
        <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
      </>
    ),
    classify: (
      <>
        <path d="M12 3.5v3M12 17.5v3M3.5 12h3m11 0h3" />
        <path d="M7.2 7.2 5.1 5.1m13.8 13.8-2.1-2.1m0-9.6 2.1-2.1M5.1 18.9l2.1-2.1" />
        <circle cx="12" cy="12" r="4.5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.4 15.4 4.1 4.1M8.2 10.8h5.2m-2.6-2.6v5.2" />
      </>
    ),
    draft: (
      <>
        <path d="M13.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5V10" />
        <path d="M8 9h5m-5 4h3m4.6-7.6 2 2m-6.1 6.1 5.8-5.8a1.4 1.4 0 0 0-2-2L11.5 7.5l-1 4.9Z" />
      </>
    ),
    track: (
      <>
        <path d="M4.5 5.5h15v14h-15zM8 3.5v4m8-4v4M4.5 9.5h15" />
        <path d="m8.5 14 2.3 2.3 4.7-4.7" />
      </>
    ),
    review: (
      <>
        <path d="M5 4.5h14v15H5zM8.5 8.5h7m-7 3.5h3" />
        <path d="m13.5 15 1.7 1.7 3.3-3.3" />
      </>
    ),
    citizen: (
      <>
        <circle cx="12" cy="8" r="3.3" />
        <path d="M5.5 20v-1.7a6.5 6.5 0 0 1 13 0V20h-13Z" />
      </>
    ),
    officer: (
      <>
        <path d="M4 20h16M6.5 20V9.5h11V20M4.5 9.5 12 4l7.5 5.5" />
        <path d="M10 20v-5h4v5m-5-8h.1m5.8 0h.1" />
      </>
    ),
  } satisfies Record<IconName, ReactNode>;

  return (
    <svg
      aria-hidden="true"
      className="line-icon"
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

const features: {
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    title: "Online RTI submission",
    description:
      "A guided digital starting point for preparing and submitting an information request.",
    icon: "submit",
  },
  {
    title: "AI request classification",
    description:
      "AI-assisted suggestions can help route a request to the relevant department for review.",
    icon: "classify",
  },
  {
    title: "Intelligent document search",
    description:
      "Help officers find relevant information across authorized department documents.",
    icon: "search",
  },
  {
    title: "AI-assisted response drafting",
    description:
      "Prepare response drafts with supporting references for an authorized officer to review.",
    icon: "draft",
  },
  {
    title: "Application tracking",
    description:
      "Give applicants a clear place to follow updates and the progress of their request.",
    icon: "track",
  },
  {
    title: "Officer review and approval",
    description:
      "Keep official decisions, approvals, and issued responses under human officer control.",
    icon: "review",
  },
];

const workflow = [
  {
    title: "Prepare your request",
    description:
      "Describe the information you are seeking and choose the appropriate public authority.",
  },
  {
    title: "Submit and receive updates",
    description:
      "Send your application through the citizen portal and keep its reference details handy.",
  },
  {
    title: "Department reviews the request",
    description:
      "The request is routed for officer review; AI suggestions may support classification and search.",
  },
  {
    title: "Officer prepares a response",
    description:
      "An authorized officer reviews the material and remains responsible for the official decision.",
  },
  {
    title: "Follow the response",
    description:
      "Return to the portal to check request updates and view an issued response when available.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`section-heading${centered ? " section-heading--centered" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="visual-orbit visual-orbit--outer" />
      <div className="visual-orbit visual-orbit--inner" />
      <div className="visual-sun" />
      <div className="visual-building">
        <div className="building-roof" />
        <div className="building-pediment">
          <span />
          <span />
          <span />
        </div>
        <div className="building-columns">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="building-base" />
      </div>
      <div className="visual-label visual-label--left">
        <span className="visual-dot visual-dot--gold" />
        <span>Information access</span>
      </div>
      <div className="visual-label visual-label--right">
        <span className="visual-dot visual-dot--green" />
        <span>Human-led decisions</span>
      </div>
      <div className="visual-caption">A more connected RTI journey</div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-line" />
            Digital services for information access
          </div>
          <h1 id="hero-title">Making Right to Information Management Smarter</h1>
          <p className="hero-description">
            A simpler digital journey for RTI requests. Bring submission,
            request tracking, and officer workflows together—with AI assistance
            supporting the process and people in charge of every decision.
          </p>
          <div className="hero-actions">
            <Link className="button button--gold" href="/citizen/submit">
              Submit an RTI Request
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button--outline-light" href="/citizen/track">
              Track Your Application
            </Link>
          </div>
          <p className="hero-assurance">
            <span aria-hidden="true">✓</span> Human review remains central to
            every official response
          </p>
        </div>
        <HeroIllustration />
      </div>
      <div className="hero-bottom-rule" />
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about-section section-pad" id="about-rti">
      <div className="container about-grid">
        <div className="about-accent" aria-hidden="true">
          <div className="about-accent-inner">
            <span className="about-quote-mark">“</span>
            <span className="about-accent-label">A right to know</span>
            <span className="about-accent-rule" />
            <span className="about-accent-small">Enabling informed citizens</span>
          </div>
        </div>
        <div className="about-copy">
          <SectionHeading
            eyebrow="About the RTI Act"
            title="The right to information helps make governance more transparent."
          />
          <p>
            The Right to Information Act, 2005 provides a framework for citizens
            to seek information from public authorities. It supports
            transparency and accountability by giving people a way to ask for
            information held by government bodies.
          </p>
          <p>
            This project aims to make the request journey easier to navigate
            while helping officers organize and review requests. AI tools are
            intended to assist with administrative tasks—not to make statutory
            decisions or replace an officer&apos;s judgment.
          </p>
          <a
            className="text-link"
            href="https://rti.gov.in/"
            target="_blank"
            rel="noreferrer"
          >
            Learn about RTI from the official portal
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="features-section section-pad" id="features">
      <div className="container">
        <SectionHeading
          centered
          eyebrow="Designed around your journey"
          title="One platform, clearer processes"
          description="Thoughtful tools for applicants and public authority teams, with human oversight built into the workflow."
        />
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card-top">
                <span className="feature-icon">
                  <Icon name={feature.icon} />
                </span>
                <span className="feature-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="workflow-section section-pad" id="how-it-works">
      <div className="container">
        <SectionHeading
          centered
          eyebrow="How it works"
          title="From citizen request to officer response"
          description="A clear, accountable flow designed to keep people informed at every step."
        />
        <ol className="workflow-list">
          {workflow.map((step, index) => (
            <li className="workflow-step" key={step.title}>
              <span className="workflow-marker">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </span>
              <div className="workflow-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PortalsSection() {
  return (
    <section className="portals-section section-pad">
      <div className="container">
        <SectionHeading
          centered
          eyebrow="A place for every role"
          title="Built for citizens and officers"
          description="Separate starting points for applicants and public authority teams."
        />
        <div className="portal-grid">
          <article className="portal-card portal-card--citizen">
            <span className="portal-icon">
              <Icon name="citizen" />
            </span>
            <span className="portal-label">For applicants</span>
            <h3>Citizen portal</h3>
            <p>
              Prepare an RTI request, keep track of its progress, and find
              updates in one place.
            </p>
            <Link className="portal-link" href="/citizen/dashboard">
              Explore the citizen portal <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="portal-card portal-card--officer">
            <span className="portal-icon">
              <Icon name="officer" />
            </span>
            <span className="portal-label">For public authority teams</span>
            <h3>Officer portal</h3>
            <p>
              Organize incoming requests, review relevant information, and
              prepare responses with human oversight.
            </p>
            <Link className="portal-link" href="/officer/dashboard">
              Explore the officer portal <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <WorkflowSection />
        <PortalsSection />
      </main>
      <SiteFooter />
    </>
  );
}
