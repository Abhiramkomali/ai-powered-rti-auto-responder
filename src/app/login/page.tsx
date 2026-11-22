import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />

      <main className="placeholder-main">
        <div className="container">
          <div className="placeholder-card login-card">
            <span className="eyebrow">Welcome back</span>
            <h1>Access your Soochna account</h1>
            <p className="placeholder-description">
              Sign in to manage your RTI requests and access your portal.
            </p>

            <LoginForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}