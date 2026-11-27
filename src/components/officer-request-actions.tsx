"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  permittedRequestStatusTransitions,
  type RequestStatus,
} from "@/lib/domain/requests";

export function OfficerRequestActions({
  requestId,
  referenceNumber,
  initialStatus,
  actorRole,
}: {
  requestId: string;
  referenceNumber: string;
  initialStatus: RequestStatus;
  actorRole: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftError, setDraftError] = useState("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  useEffect(() => {
  let cancelled = false;

  async function loadLatestDraft() {
    try {
      const response = await fetch(
        `/api/requests/${encodeURIComponent(requestId)}/draft`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error?.message ?? "Unable to load the saved draft."
        );
      }

      const drafts = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      if (!cancelled) {
        setDraft(drafts[0]?.content ?? "");
      }
    } catch (loadError) {
      if (!cancelled) {
        setDraftError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the saved draft."
        );
      }
    }
  }

  void loadLatestDraft();

  return () => {
    cancelled = true;
  };
}, [requestId]);

  const options = permittedRequestStatusTransitions[status];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);

    const newStatus = (new FormData(event.currentTarget).get("status") as RequestStatus);
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, remarks }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error?.message ?? "Unable to update the request.");
        return;
      }
      setStatus(result.data.status);
      setRemarks("");
      setMessage(`${referenceNumber} updated to ${result.data.status.replaceAll("_", " ").toLowerCase()}.`);
    } catch {
      setError("Unable to update the request.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDraft() {
    setDraftMessage("");
    setDraftError("");
    setIsDraftSaving(true);
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, aiGenerated: false }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Unable to save the draft.");
      setDraft(result.data?.content ?? draft);
      setDraftMessage("Response draft saved successfully.");
    } catch (saveError) {
      setDraftError(saveError instanceof Error ? saveError.message : "Unable to save the draft.");
    } finally {
      setIsDraftSaving(false);
    }
  }

  async function approveOrIssue(action: "approval" | "issue") {
    setDraftMessage("");
    setDraftError("");
    setIsDraftSaving(true);
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}/${action}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? `Unable to ${action} the response.`);
      setStatus(action === "approval" ? "APPROVED" : "RESPONSE_ISSUED");
      setDraftMessage(action === "approval" ? "Approved response recorded." : "Approved final response issued to the citizen.");
    } catch (actionError) {
      setDraftError(actionError instanceof Error ? actionError.message : `Unable to ${action} the response.`);
    } finally {
      setIsDraftSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "1.2rem", display: "grid", gap: "0.8rem" }}>
      {options.length > 0 ? (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.7rem" }}>
          <label htmlFor={`status-${requestId}`} style={{ fontSize: "0.82rem", fontWeight: 700 }}>Update status</label>
          <select id={`status-${requestId}`} name="status" required style={{ minHeight: 42, border: "1px solid var(--line)", borderRadius: 6, padding: "0.6rem" }}>
            <option value="">Choose the next status</option>
            {options.map((option) => (
              <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
            ))}
          </select>
          <textarea
            aria-label="Status update notes"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Optional workflow note"
            maxLength={2000}
            style={{ minHeight: 72, border: "1px solid var(--line)", borderRadius: 6, padding: "0.6rem", resize: "vertical" }}
          />
          {error && <p role="alert" style={{ color: "#a52a2a", margin: 0 }}>{error}</p>}
          {message && <p role="status" style={{ color: "#2f6b4f", margin: 0 }}>{message}</p>}
          <button className="button button--navy" type="submit" disabled={isSaving} style={{ justifySelf: "start" }}>
            {isSaving ? "Saving..." : "Save status"}
          </button>
        </form>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>This request has reached a terminal status.</p>
      )}

      {["PIO", "DEALING_OFFICER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN"].includes(actorRole) && status !== "RESPONSE_ISSUED" && (
        <section style={{ borderTop: "1px solid var(--line)", paddingTop: "0.8rem", display: "grid", gap: "0.6rem" }}>
          <label htmlFor={`draft-${requestId}`} style={{ fontSize: "0.82rem", fontWeight: 700 }}>Response draft (not visible to citizen)</label>
          <textarea
            id={`draft-${requestId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={"1. [Requested information]\nResponse: [verified information or pending verification]\n\nPIO review checklist:\n- Verify record reference\n- Remove uncertainty\n- Confirm human approval"}
            maxLength={30000}
            style={{ minHeight: 150, border: "1px solid var(--line)", borderRadius: 6, padding: "0.7rem", resize: "vertical" }}
          />
          {draftError && <p role="alert" style={{ color: "#a52a2a", margin: 0 }}>{draftError}</p>}
          {draftMessage && <p role="status" style={{ color: "#2f6b4f", margin: 0 }}>{draftMessage}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <button type="button" className="button button--navy" onClick={() => void saveDraft()} disabled={isDraftSaving || draft.trim().length < 20}>
              {isDraftSaving ? "Saving..." : "Save draft"}
            </button>
            {actorRole === "PIO" && status !== "APPROVED" && (
              <button type="button" className="button button--navy" onClick={() => void approveOrIssue("approval")} disabled={isDraftSaving}>
                Approve latest draft
              </button>
            )}
            {actorRole === "PIO" && status === "APPROVED" && (
              <button type="button" className="button button--navy" onClick={() => void approveOrIssue("issue")} disabled={isDraftSaving}>
                Issue approved response
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
