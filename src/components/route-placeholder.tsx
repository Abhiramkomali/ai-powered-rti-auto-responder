import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface RoutePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  links: { href: string; label: string }[];
}

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  links,
}: RoutePlaceholderProps) {
  return (
    <>
      <SiteHeader />
      <main className="placeholder-main">
        <div className="container">
          <div className="placeholder-card">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="placeholder-description">{description}</p>
            <div className="placeholder-notice">
              <span className="placeholder-notice-icon" aria-hidden="true">
                i
              </span>
              <p>
                This page is a foundation-stage placeholder. Portal features
                will be built in a later development stage; no account or
                request data is being processed here.
              </p>
            </div>
            <nav className="placeholder-links" aria-label="Related pages">
              {links.map((link) => (
                <Link className="button button--navy" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link className="button button--text" href="/">
                Return to home
              </Link>
            </nav>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
