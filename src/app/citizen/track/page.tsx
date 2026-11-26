
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type TrackApiResult =
  | {
      ok: true;
      data: {
        referenceNumber: string;
        departmentId: string;
        status: string;
        submittedAt: string;
        finalResponse: { content: string; issuedAt: string } | null;
      };
      requestId: string;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
      requestId: string;
    };

export default function CitizenTrackPage() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState<
  Extract<TrackApiResult, { ok: true }>["data"] | null
>(null);

  async function handleTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setRequest(null);

    const normalizedReference = referenceNumber.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedReference || !normalizedEmail) {
      setError("Please enter both your reference number and email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber: normalizedReference,
          email: normalizedEmail,
        }),
      });

      const result = (await response.json()) as TrackApiResult;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.ok
            ? "Unable to track your request. Please try again."
            : result.error.message,
        );
      }

      setRequest(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function formatStatus(status: string) {
    return status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }

  return (
    <>
      <SiteHeader />

      <main className="placeholder-main">
        <div className="container">
          <section className="placeholder-card">
            <span className="eyebrow">CITIZEN PORTAL</span>

            <h1>Track your application</h1>

            <p className="placeholder-description">
              Enter your RTI reference number and registered email address
              to check the latest status of your application.
            </p>

            <form onSubmit={handleTrack} noValidate>
              <div
                className="request-field"
                style={{ marginTop: "1.8rem" }}
              >
                <label htmlFor="tracking-reference">
                  RTI reference number
                </label>

                <input
                  id="tracking-reference"
                  type="text"
                  placeholder="RTI-YYYYMMDD-XXXXXX"
                  value={referenceNumber}
                  onChange={(event) =>
                    setReferenceNumber(event.target.value)
                  }
                  autoComplete="off"
                  required
                />
              </div>

              <div
                className="request-field"
                style={{ marginTop: "1.2rem" }}
              >
                <label htmlFor="tracking-email">
                  Registered email address
                </label>

                <input
                  id="tracking-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div
                  className="placeholder-notice"
                  role="alert"
                  style={{ marginTop: "1.2rem" }}
                >
                  <span
                    className="placeholder-notice-icon"
                    aria-hidden="true"
                  >
                    !
                  </span>
                  <p>{error}</p>
                </div>
              )}

              <div className="placeholder-links">
                <button
                  type="submit"
                  className="button button--navy"
                  disabled={isLoading}
                >
                  {isLoading ? "Checking..." : "Track application"}
                </button>

                <Link
                  className="button button--text"
                  href="/citizen/dashboard"
                >
                  Back to dashboard
                </Link>
              </div>
            </form>

            {request && (
              <section
                className="placeholder-notice"
                aria-live="polite"
                style={{
                  marginTop: "2rem",
                  background: "#f7f9fa",
                }}
              >
                <div style={{ width: "100%" }}>
                  <span className="eyebrow">APPLICATION DETAILS</span>

                  <h2
                    style={{
                      color: "var(--navy)",
                      marginTop: "0.8rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Request found
                  </h2>

                  <dl style={{ marginTop: "1rem", lineHeight: 2 }}>
                    <div>
                      <dt>Reference number</dt>
                      <dd>{request.referenceNumber}</dd>
                    </div>

                    <div>
                      <dt>Department</dt>
                      <dd>
                        {request.departmentId.replaceAll("-", " ")}
                      </dd>
                    </div>

                    <div>
                      <dt>Current status</dt>
                      <dd>
                        <strong>{formatStatus(request.status)}</strong>
                      </dd>
                    </div>

                    <div>
                      <dt>Submitted on</dt>
                      <dd>{formatDate(request.submittedAt)}</dd>
                    </div>
                  </dl>
                  {request.finalResponse && (
                    <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
                      <span className="eyebrow">AUTHORIZED RESPONSE</span>
                      <p style={{ whiteSpace: "pre-wrap", marginTop: "0.7rem" }}>{request.finalResponse.content}</p>
                      <small>Issued {formatDate(request.finalResponse.issuedAt)}</small>
                    </div>
                  )}
                </div>
              </section>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
