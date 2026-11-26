"use client";

import { FormEvent, useState } from "react";

import styles from "./ai-assistant.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type RequestOption = {
  id: string;
  referenceNumber: string;
  subject: string;
};

const citizenPrompts = [
  "How do I submit an RTI request?",
  "What does Under Review mean?",
  "How can I track my application?",
];

const officerPrompts = [
  "Summarize the selected application.",
  "What information is being requested?",
  "What details may need verification?",
];

export function AiAssistant({
  audience,
  requests = [],
  providerConfigured,
}: {
  audience: "citizen" | "officer";
  requests?: RequestOption[];
  providerConfigured: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const prompts = audience === "citizen" ? citizenPrompts : officerPrompts;

  async function sendMessage(content: string) {
    const text = content.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setRetryMessage(text);
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          ...(requestId ? { requestId } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.reply !== "string") {
        throw new Error(result.error ?? "The assistant could not answer. Please retry.");
      }

      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
      setRetryMessage(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The assistant could not answer. Please retry.");
      setMessages((current) => current.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <section className={styles.assistant} aria-label="Soochna AI Assistant">
      <button
        className={styles.launcher}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.launcherMark} aria-hidden="true">S</span>
        <span>
          <strong>Soochna AI Assistant</strong>
          <small>{isOpen ? "Close assistant" : "Ask about RTI and this portal"}</small>
        </span>
        <span className={styles.launcherArrow} aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <div>
              <strong>Soochna AI Assistant</strong>
              <span className={styles.mode}>
                {providerConfigured ? "Gemini provider configured" : "Demonstration mode · no AI key"}
              </span>
            </div>
            <button
              className={styles.clearButton}
              type="button"
              onClick={() => {
                setMessages([]);
                setError("");
                setRetryMessage(null);
              }}
              disabled={messages.length === 0 && !error}
            >
              Clear chat
            </button>
          </header>

          {requests.length > 0 && (
            <label className={styles.contextPicker}>
              <span>{audience === "citizen" ? "Ask about your application (optional)" : "Application context (optional)"}</span>
              <select value={requestId} onChange={(event) => setRequestId(event.target.value)}>
                <option value="">General question</option>
                {requests.map((request) => (
                  <option value={request.id} key={request.id}>
                    {request.referenceNumber} · {request.subject}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className={styles.transcript} aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon} aria-hidden="true">?</span>
                <strong>How can I help?</strong>
                <p>
                  {audience === "citizen"
                    ? "Ask about submitting, tracking, or understanding your RTI request."
                    : "Ask about an authorized application or the officer workflow."}
                </p>
                <div className={styles.suggestions}>
                  {prompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={isSending}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.assistantMessage}`}
                  key={`${index}-${message.role}`}
                >
                  <span>{message.role === "user" ? "You" : "Soochna Assistant"}</span>
                  <p>{message.content}</p>
                </article>
              ))
            )}
            {isSending && (
              <div className={`${styles.message} ${styles.assistantMessage}`} role="status" aria-label="Assistant is responding">
                <span>Soochna Assistant</span>
                <p className={styles.typing}><i /><i /><i /></p>
              </div>
            )}
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              {retryMessage && (
                <button type="button" onClick={() => void sendMessage(retryMessage)} disabled={isSending}>
                  Retry
                </button>
              )}
            </div>
          )}

          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.visuallyHidden} htmlFor="soochna-assistant-message">Your message</label>
            <textarea
              id="soochna-assistant-message"
              rows={2}
              maxLength={2000}
              placeholder="Type a question..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !draft.trim()} aria-label="Send message">
              Send
            </button>
          </form>

          <p className={styles.disclaimer}>
            {providerConfigured
              ? "AI can make mistakes. Do not enter sensitive personal details. Verify all information with an authorized human officer."
              : "Demo answers are limited and not generated by AI. This prototype is not an official government service."}
          </p>
        </div>
      )}
    </section>
  );
}
