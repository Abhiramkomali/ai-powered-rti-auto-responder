import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="placeholder-main">
        <div className="container">
          <div className="placeholder-card login-card">
            <span className="eyebrow">Citizen account</span>
            <h1>Create your Soochna account</h1>
            <p className="placeholder-description">
              Use a secure password to submit and track your RTI requests.
            </p>
            <RegisterForm />
            <div className="login-form-footer">
              <span>Already have an account?</span>
              <Link href="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
