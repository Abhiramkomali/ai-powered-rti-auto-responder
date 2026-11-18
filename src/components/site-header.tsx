import Link from "next/link";

const navigation = [
  { href: "/#about-rti", label: "About RTI" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M7.5 5.75h11l6 6v14.5h-17V5.75Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 5.75v6h6M11.5 17h9M11.5 21h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23.5" cy="23.5" r="4.25" fill="#d2a44c" stroke="white" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      className={`brand${footer ? " brand--footer" : ""}`}
      href="/"
      aria-label="Soochna home"
    >
      <BrandMark />
      <span className="brand-copy">
        <span className="brand-name">Soochna</span>
        <span className="brand-caption">RTI digital services</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className="nav-link nav-link--active" href="/">
            Home
          </Link>
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="login-link" href="/login">
            Login
          </Link>
          <Link className="button button--small button--navy" href="/register">
            Register
          </Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <span />
            <span />
            <span />
          </summary>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <Link href="/">Home</Link>
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
