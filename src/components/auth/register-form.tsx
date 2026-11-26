"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error?.message ?? "Registration failed. Please try again.");
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/citizen/dashboard",
      });
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-field">
        <label htmlFor="register-name">Full name</label>
        <input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
      </div>
      <div className="login-field">
        <label htmlFor="register-email">Email address</label>
        <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </div>
      <div className="login-field">
        <label htmlFor="register-password">Password</label>
        <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
      </div>
      <div className="login-field">
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input id="register-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
      </div>
      {error && <div className="login-error" role="alert">{error}</div>}
      <button className="button button--navy login-submit" type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create citizen account"}
      </button>
    </form>
  );
}
