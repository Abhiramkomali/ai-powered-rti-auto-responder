"use client";

import { FormEvent, useState } from "react";

type Department = { id: string; name: string };
type RecordItem = {
  id: string;
  title: string;
  referenceNumber: string;
  category: string;
  documentType: string;
  isDemo: boolean;
};

export function DepartmentRecordManager({
  departments,
  initialRecords,
  canManage,
}: {
  departments: Department[];
  initialRecords: RecordItem[];
  canManage: boolean;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/department-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: String(form.get("departmentId")),
          title: String(form.get("title")),
          description: String(form.get("description")),
          category: String(form.get("category")),
          referenceNumber: String(form.get("referenceNumber")),
          documentType: String(form.get("documentType")),
          storageReference: String(form.get("storageReference") || ""),
          isDemo: form.get("isDemo") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error?.message ?? "Unable to save the record.");
      setRecords((current) => [result.data, ...current]);
      setMessage("Departmental record saved.");
      event.currentTarget.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the record.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      {canManage && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.8rem", background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "1.2rem" }}>
          <h2 style={{ color: "var(--navy)", margin: 0 }}>Add departmental record</h2>
          <label>Department<select name="departmentId" required>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <label>Title<input name="title" minLength={3} maxLength={200} required /></label>
          <label>Description<textarea name="description" minLength={10} maxLength={5000} required /></label>
          <label>Category<input name="category" minLength={2} maxLength={100} required /></label>
          <label>Reference number<input name="referenceNumber" minLength={3} maxLength={100} required /></label>
          <label>Document type<input name="documentType" minLength={2} maxLength={100} required /></label>
          <label>Secure storage/reference<input name="storageReference" maxLength={500} placeholder="Opaque storage key or document reference" /></label>
          <label><input type="checkbox" name="isDemo" defaultChecked /> Fictional demonstration record</label>
          {error && <p role="alert" style={{ color: "#a52a2a", margin: 0 }}>{error}</p>}
          {message && <p role="status" style={{ color: "#2f6b4f", margin: 0 }}>{message}</p>}
          <button className="button button--navy" type="submit" disabled={isSaving} style={{ justifySelf: "start" }}>{isSaving ? "Saving..." : "Save record"}</button>
        </form>
      )}
      <section style={{ display: "grid", gap: "0.8rem" }}>
        {records.map((record) => (
          <article key={record.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "1rem" }}>
            <strong style={{ color: "var(--navy)" }}>{record.title}</strong>
            <p style={{ margin: "0.35rem 0", color: "var(--muted)", fontSize: "0.85rem" }}>{record.referenceNumber} · {record.category} · {record.documentType}</p>
            {record.isDemo && <span style={{ color: "#8a6500", fontSize: "0.78rem", fontWeight: 700 }}>FICTIONAL DEMONSTRATION RECORD</span>}
          </article>
        ))}
      </section>
    </div>
  );
}
