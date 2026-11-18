import Link from "next/link";

import { Brand } from "@/components/site-header";

const footerLinks = [
  { href: "/#about-rti", label: "About RTI" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-intro">
            <Brand footer />
            <p>
              Supporting a clearer, more accessible journey from information
              request to response.
            </p>
          </div>
          <div className="footer-links-wrap">
            <h2 className="footer-heading">Explore</h2>
            <nav className="footer-links" aria-label="Footer navigation">
              {footerLinks.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="footer-note">
            <h2 className="footer-heading">A note on this project</h2>
            <p>
              An academic project prototype. It is not an official government
              website or a substitute for filing through the appropriate
              authority.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Soochna · Academic project</span>
          <span>AI assists the process; authorized officers make decisions.</span>
        </div>
      </div>
    </footer>
  );
}
