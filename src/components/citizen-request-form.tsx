"use client";
import { departments } from "@/lib/domain/departments";
import Link from "next/link";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { SiteHeader } from "@/components/site-header";



const acceptedFileTypes = new Map([
  [".pdf", "application/pdf"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);
const maximumFileBytes = 5 * 1024 * 1024;
const initialValues: FormValues = {
  fullName: "",
  email: "",
  mobile: "",
  address: "",
  state: "",
  district: "",
  pinCode: "",
  departmentId: "",
  subject: "",
  description: "",
  dateFrom: "",
  dateTo: "",
  responseFormat: "",
};

interface FormValues {
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  departmentId: string;
  subject: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  responseFormat: "" | "electronic" | "physical";
}

type FormFieldName = keyof FormValues;
type FieldErrors = Partial<Record<FormFieldName | "declaration", string>>;
type FormStep = "form" | "review" | "confirmation";

function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = values.fullName.trim();
  const trimmedEmail = values.email.trim();
  const trimmedAddress = values.address.trim();
  const trimmedSubject = values.subject.trim();
  const trimmedDescription = values.description.trim();

  if (trimmedName.length < 2) {
    errors.fullName = "Enter your full name (at least 2 characters).";
  } else if (trimmedName.length > 100) {
    errors.fullName = "Full name must be 100 characters or fewer.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  } else if (trimmedEmail.length > 254) {
    errors.email = "Email address must be 254 characters or fewer.";
  }

  if (!/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(values.mobile.trim())) {
    errors.mobile = "Enter a valid 10-digit Indian mobile number.";
  }

  if (trimmedAddress.length < 8) {
    errors.address = "Enter a complete mailing address.";
  } else if (trimmedAddress.length > 300) {
    errors.address = "Address must be 300 characters or fewer.";
  }

  if (!values.state.trim()) {
    errors.state = "Enter your state or union territory.";
  } else if (values.state.trim().length > 80) {
    errors.state = "State or union territory must be 80 characters or fewer.";
  }

  if (!values.district.trim()) {
    errors.district = "Enter your district.";
  } else if (values.district.trim().length > 80) {
    errors.district = "District must be 80 characters or fewer.";
  }

  if (!/^\d{6}$/.test(values.pinCode.trim())) {
    errors.pinCode = "Enter a valid 6-digit PIN code.";
  }

  if (!departments.some((department) => department.id === values.departmentId)) {
    errors.departmentId = "Select a public authority or department.";
  }

  if (trimmedSubject.length < 5) {
    errors.subject = "Add a short, specific subject (at least 5 characters).";
  } else if (trimmedSubject.length > 150) {
    errors.subject = "Subject must be 150 characters or fewer.";
  }

  if (trimmedDescription.length < 20) {
    errors.description =
      "Describe the information you need in at least 20 characters.";
  } else if (trimmedDescription.length > 5000) {
    errors.description = "Description must be 5,000 characters or fewer.";
  }

  if (Boolean(values.dateFrom) !== Boolean(values.dateTo)) {
    errors.dateFrom = "Enter both dates, or leave both blank.";
    errors.dateTo = "Enter both dates, or leave both blank.";
  } else if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
    errors.dateTo = "End date must be on or after the start date.";
  }

  if (!values.responseFormat) {
    errors.responseFormat = "Choose a preferred response format.";
  }

  return errors;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileValidationError(file: File): string | null {
  const dotIndex = file.name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
  const expectedMimeType = acceptedFileTypes.get(extension);

  if (!expectedMimeType || (file.type && file.type !== expectedMimeType)) {
    return "Choose a PDF, JPG, JPEG, or PNG file.";
  }
  if (file.size > maximumFileBytes) {
    return `${file.name} is larger than the 5 MB per-file limit.`;
  }
  if (file.size === 0) {
    return `${file.name} is empty. Choose a file with content.`;
  }
  return null;
}


function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <span className="request-field-error" id={id} role="alert">
      {children}
    </span>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="request-form-section">
      <div className="request-section-heading">
        <span className="request-section-number" aria-hidden="true">{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="request-section-content">{children}</div>
    </section>
  );
}

function ReviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="request-review-item">
      <dt>{label}</dt>
      <dd>{children || <span className="request-review-muted">Not provided</span>}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
type CreateRequestApiResult =
  | {
      ok: true;
      data: {
        id: string;
        referenceNumber: string;
        status: string;
        submittedAt: string;
      };
      requestId: string;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
      requestId: string;
    };

export function CitizenRequestForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState<FormStep>("form");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  function updateField(field: FormFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      if (field === "dateFrom" || field === "dateTo") {
        delete next.dateFrom;
        delete next.dateTo;
      }
      return next;
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(event.currentTarget.files ?? []);
    const invalidFile = newFiles.map(getFileValidationError).find(Boolean);
    if (invalidFile) {
      setFileError(invalidFile);
      event.currentTarget.value = "";
      return;
    }

    setFileError("");
    setSelectedFiles((current) => {
      const additions = newFiles.filter(
        (newFile) =>
          !current.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size &&
              existingFile.lastModified === newFile.lastModified,
          ),
      );
      return [...current, ...additions];
    });
    event.currentTarget.value = "";
  }

  function removeFile(fileToRemove: File) {
    setSelectedFiles((current) =>
      current.filter(
        (file) =>
          file.name !== fileToRemove.name ||
          file.size !== fileToRemove.size ||
          file.lastModified !== fileToRemove.lastModified,
      ),
    );
    setFileError("");
  }

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (step === "form") {
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || fileError) {
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (step === "review") {
    if (!declarationAccepted) {
      setErrors((current) => ({
        ...current,
        declaration: "Confirm the declaration before submitting your prototype request.",
      }));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Normalize the mobile number to the 10-digit format expected by the API.
      const normalizedMobile = values.mobile
        .trim()
        .replace(/^\+91[\s-]?/, "")
        .replace(/[\s-]/g, "");

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          mobile: normalizedMobile,
        }),
      });

      const result =
        (await response.json()) as CreateRequestApiResult;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.ok
            ? "Unable to save your request. Please try again."
            : result.error.message,
        );
      }

      // Store the real reference returned by the backend.
      setReferenceNumber(result.data.referenceNumber);

      setValues(initialValues);
      setSelectedFiles([]);
      setDeclarationAccepted(false);
      setErrors({});
      setFileError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setStep("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
}

function startAnotherRequest() {
  setReferenceNumber("");
  setSubmitError("");
  setStep("form");
  setErrors({});
  window.scrollTo({ top: 0, behavior: "smooth" });
}
  const selectedDepartment = departments.find(
    (department) => department.id === values.departmentId,
  );
  const hasFieldErrors = Object.keys(errors).some((field) => field !== "declaration");

  return (
    <>
      <SiteHeader />
      <main className="request-page">
        <div className="request-page-container">
          <nav aria-label="Breadcrumb" className="request-breadcrumb">
            <Link href="/citizen/dashboard">Citizen portal</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Submit RTI request</span>
          </nav>

          <header className="request-page-heading">
            <div>
              <span className="request-eyebrow">CITIZEN SERVICES</span>
              <h1>
                {step === "confirmation"
                  ? "Demonstration complete"
                  : step === "review"
                    ? "Review your request"
                    : "Submit an RTI request"}
              </h1>
              <p>
                {step === "confirmation"
                  ? "Your demo reference is ready. No application was sent to a government department."
                  : step === "review"
                    ? "Please review the details below before confirming this demonstration."
                    : "Share the information you are seeking and choose the public authority most relevant to your request."}
              </p>
            </div>
            <span className="request-prototype-badge">
              <span aria-hidden="true" />
              Prototype demonstration
            </span>
          </header>

          <div className="request-demo-notice" role="note">
            <span className="request-notice-icon" aria-hidden="true">i</span>
            <p>
              <strong>Demonstration only.</strong> This form does not submit an official RTI
              application. Your information and selected documents are not saved or sent to a server.
            </p>
          </div>

          <ol aria-label="Request form progress" className="request-progress">
            {[
              { key: "form", title: "Request details" },
              { key: "review", title: "Review & declaration" },
              { key: "confirmation", title: "Demo confirmation" },
            ].map((item, index) => {
              const isCurrent = item.key === step;
              const isComplete =
                (step === "review" && item.key === "form") ||
                (step === "confirmation" && item.key !== "confirmation");

              return (
                <li
                  aria-current={isCurrent ? "step" : undefined}
                  className={`request-progress-step${isCurrent ? " is-current" : ""}${isComplete ? " is-complete" : ""}`}
                  key={item.key}
                >
                  <span className="request-progress-marker">
                    {isComplete ? "✓" : String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item.title}</span>
                </li>
              );
            })}
          </ol>

          {step === "confirmation" ? (
            <section aria-labelledby="request-confirmation-title" className="request-confirmation">
              <span className="request-confirmation-icon" aria-hidden="true">✓</span>
              <span className="request-eyebrow">REQUEST SUBMITTED</span>
              <h2 id="request-confirmation-title">Your request has been saved successfully</h2>
              <p>
              Your request has been saved in the Soochna prototype database.
              This is an academic prototype reference, not an official government
              RTI acknowledgement.
              </p>
              <div className="request-demo-reference">
              <span>SOOCHNA REFERENCE NUMBER</span>
              <strong>{referenceNumber}</strong>
              <small>Keep this reference number to identify your request in the prototype.</small>
              </div>
              <div className="request-confirmation-actions">
                <button className="button button--navy" onClick={startAnotherRequest} type="button">
                  Submit another request
                </button>
                <Link className="button button--text" href="/citizen/dashboard">
                  Return to dashboard
                </Link>
              </div>
            </section>
          ) : (
            <form
              autoComplete="off"
              className="request-form-card"
              noValidate
              onSubmit={handleSubmit}
            >
              {step === "form" ? (
                <>
                  {(hasFieldErrors || fileError) && (
                    <div
                      className="request-error-summary"
                      id="request-error-summary"
                      role="alert"
                      ref={errorSummaryRef}
                      tabIndex={-1}
                    >
                      <strong>Please check the highlighted information.</strong>
                      <span>
                        {Object.keys(errors).filter((field) => field !== "declaration").length +
                          (fileError ? 1 : 0)}{" "}
                        item(s) need attention before you can review this request.
                      </span>
                    </div>
                  )}

                  <FormSection
                    description="Enter the contact details to include in this demonstration request."
                    number="01"
                    title="Applicant information"
                  >
                    <div className="request-field-grid">
                      <div className="request-field request-field--full">
                        <label htmlFor="fullName">Full name <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.fullName ? "fullName-error" : undefined}
                          aria-invalid={Boolean(errors.fullName)}
                          id="fullName"
                          maxLength={100}
                          name="fullName"
                          onBlur={() => {
                            if (values.fullName.trim().length < 2) {
                              setErrors((current) => ({
                                ...current,
                                fullName: "Enter your full name (at least 2 characters).",
                              }));
                            }
                          }}
                          onChange={(event) => updateField("fullName", event.target.value)}
                          placeholder="Enter your full name"
                          value={values.fullName}
                        />
                        <FieldError id="fullName-error">{errors.fullName}</FieldError>
                      </div>

                      <div className="request-field">
                        <label htmlFor="email">Email address <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.email ? "email-error" : undefined}
                          aria-invalid={Boolean(errors.email)}
                          id="email"
                          maxLength={254}
                          name="email"
                          onChange={(event) => updateField("email", event.target.value)}
                          placeholder="name@example.com"
                          type="email"
                          value={values.email}
                        />
                        <FieldError id="email-error">{errors.email}</FieldError>
                      </div>

                      <div className="request-field">
                        <label htmlFor="mobile">Mobile number <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.mobile ? "mobile-error" : undefined}
                          aria-invalid={Boolean(errors.mobile)}
                          id="mobile"
                          inputMode="tel"
                          maxLength={14}
                          name="mobile"
                          onChange={(event) => updateField("mobile", event.target.value)}
                          placeholder="10-digit mobile number"
                          type="tel"
                          value={values.mobile}
                        />
                        <span className="request-field-hint">Indian mobile number, with optional +91 prefix.</span>
                        <FieldError id="mobile-error">{errors.mobile}</FieldError>
                      </div>

                      <div className="request-field request-field--full">
                        <label htmlFor="address">Address <span aria-hidden="true">*</span></label>
                        <textarea
                          autoComplete="off"
                          aria-describedby={errors.address ? "address-error" : undefined}
                          aria-invalid={Boolean(errors.address)}
                          id="address"
                          maxLength={300}
                          name="address"
                          onChange={(event) => updateField("address", event.target.value)}
                          placeholder="House number, street, locality"
                          rows={2}
                          value={values.address}
                        />
                        <FieldError id="address-error">{errors.address}</FieldError>
                      </div>

                      <div className="request-field">
                        <label htmlFor="state">State / Union Territory <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.state ? "state-error" : undefined}
                          aria-invalid={Boolean(errors.state)}
                          id="state"
                          maxLength={80}
                          name="state"
                          onChange={(event) => updateField("state", event.target.value)}
                          placeholder="Enter state or union territory"
                          value={values.state}
                        />
                        <FieldError id="state-error">{errors.state}</FieldError>
                      </div>

                      <div className="request-field">
                        <label htmlFor="district">District <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.district ? "district-error" : undefined}
                          aria-invalid={Boolean(errors.district)}
                          id="district"
                          maxLength={80}
                          name="district"
                          onChange={(event) => updateField("district", event.target.value)}
                          placeholder="Enter district"
                          value={values.district}
                        />
                        <FieldError id="district-error">{errors.district}</FieldError>
                      </div>

                      <div className="request-field request-field--half">
                        <label htmlFor="pinCode">PIN code <span aria-hidden="true">*</span></label>
                        <input
                          autoComplete="off"
                          aria-describedby={errors.pinCode ? "pinCode-error" : undefined}
                          aria-invalid={Boolean(errors.pinCode)}
                          id="pinCode"
                          inputMode="numeric"
                          maxLength={6}
                          name="pinCode"
                          onChange={(event) => updateField("pinCode", event.target.value)}
                          placeholder="6-digit PIN code"
                          value={values.pinCode}
                        />
                        <FieldError id="pinCode-error">{errors.pinCode}</FieldError>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection
                    description="Choose the public authority that is most likely to hold the information."
                    number="02"
                    title="Department information"
                  >
                    <div className="request-field request-field--full">
                      <label htmlFor="departmentId">
                        Public authority / department <span aria-hidden="true">*</span>
                      </label>
                      <select
                        aria-describedby={errors.departmentId ? "departmentId-error" : undefined}
                        aria-invalid={Boolean(errors.departmentId)}
                        id="departmentId"
                        name="departmentId"
                        onChange={(event) => updateField("departmentId", event.target.value)}
                        value={values.departmentId}
                      >
                        <option value="">Select a department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      <span className="request-field-hint">
                        These are sample choices for the prototype. Confirm the responsible public authority before making a real request.
                      </span>
                      <FieldError id="departmentId-error">{errors.departmentId}</FieldError>
                    </div>
                  </FormSection>

                  <FormSection
                    description="Be specific about the records or information you are seeking."
                    number="03"
                    title="RTI request details"
                  >
                    <div className="request-field-grid">
                      <div className="request-field request-field--full">
                        <label htmlFor="subject">Subject <span aria-hidden="true">*</span></label>
                        <input
                          aria-describedby={errors.subject ? "subject-error" : undefined}
                          aria-invalid={Boolean(errors.subject)}
                          id="subject"
                          maxLength={150}
                          name="subject"
                          onChange={(event) => updateField("subject", event.target.value)}
                          placeholder="A short summary of the information requested"
                          value={values.subject}
                        />
                        <span className="request-field-hint request-character-count">
                          {values.subject.length}/150
                        </span>
                        <FieldError id="subject-error">{errors.subject}</FieldError>
                      </div>

                      <div className="request-field request-field--full">
                        <label htmlFor="description">
                          Detailed description <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                          aria-describedby={errors.description ? "description-error" : undefined}
                          aria-invalid={Boolean(errors.description)}
                          id="description"
                          maxLength={5000}
                          name="description"
                          onChange={(event) => updateField("description", event.target.value)}
                          placeholder="Describe the specific records or information you would like to access."
                          rows={6}
                          value={values.description}
                        />
                        <span className="request-field-hint request-character-count">
                          {values.description.length}/5000
                        </span>
                        <FieldError id="description-error">{errors.description}</FieldError>
                      </div>
                    </div>

                    <aside className="request-guidance">
                      <span className="request-guidance-icon" aria-hidden="true">i</span>
                      <div>
                        <strong>Tips for a clear request</strong>
                        <ul>
                          <li>Ask for identifiable records, documents, or information.</li>
                          <li>Include a relevant date range or location when it helps narrow the records.</li>
                          <li>Keep the request focused and avoid including unnecessary personal details.</li>
                        </ul>
                        <p>This guidance is general and does not guarantee that a request is valid or that information will be disclosed.</p>
                      </div>
                    </aside>

                    <div className="request-subsection">
                      <h3>Date range <span>(optional)</span></h3>
                      <p>If relevant, specify the period the requested records relate to.</p>
                      <div className="request-date-fields">
                        <div className="request-field">
                          <label htmlFor="dateFrom">From</label>
                          <input
                            aria-describedby={errors.dateFrom ? "dateFrom-error" : undefined}
                            aria-invalid={Boolean(errors.dateFrom)}
                            id="dateFrom"
                            name="dateFrom"
                            onChange={(event) => updateField("dateFrom", event.target.value)}
                            type="date"
                            value={values.dateFrom}
                          />
                          <FieldError id="dateFrom-error">{errors.dateFrom}</FieldError>
                        </div>
                        <div className="request-field">
                          <label htmlFor="dateTo">To</label>
                          <input
                            aria-describedby={errors.dateTo ? "dateTo-error" : undefined}
                            aria-invalid={Boolean(errors.dateTo)}
                            id="dateTo"
                            name="dateTo"
                            onChange={(event) => updateField("dateTo", event.target.value)}
                            type="date"
                            value={values.dateTo}
                          />
                          <FieldError id="dateTo-error">{errors.dateTo}</FieldError>
                        </div>
                      </div>
                    </div>

                    <fieldset
                      aria-describedby={errors.responseFormat ? "responseFormat-error" : undefined}
                      aria-invalid={Boolean(errors.responseFormat)}
                      className="request-format-fieldset"
                    >
                      <legend>Preferred response format <span aria-hidden="true">*</span></legend>
                      <div className="request-format-options">
                        <label className={`request-format-option${values.responseFormat === "electronic" ? " is-selected" : ""}`}>
                          <input
                            checked={values.responseFormat === "electronic"}
                            name="responseFormat"
                            onChange={() => updateField("responseFormat", "electronic")}
                            type="radio"
                            value="electronic"
                          />
                          <span className="request-format-radio" aria-hidden="true" />
                          <span>
                            <strong>Electronic</strong>
                            <small>Email or digital format</small>
                          </span>
                        </label>
                        <label className={`request-format-option${values.responseFormat === "physical" ? " is-selected" : ""}`}>
                          <input
                            checked={values.responseFormat === "physical"}
                            name="responseFormat"
                            onChange={() => updateField("responseFormat", "physical")}
                            type="radio"
                            value="physical"
                          />
                          <span className="request-format-radio" aria-hidden="true" />
                          <span>
                            <strong>Physical</strong>
                            <small>Paper copies by post</small>
                          </span>
                        </label>
                      </div>
                      <FieldError id="responseFormat-error">{errors.responseFormat}</FieldError>
                    </fieldset>
                  </FormSection>

                  <FormSection
                    description="Optionally select files to include in this local demonstration."
                    number="04"
                    title="Supporting documents"
                  >
                    <div className="request-upload-area">
                      <label className="request-upload-button" htmlFor="supportingDocuments">
                        <span className="request-upload-icon" aria-hidden="true">+</span>
                        <span>
                          <strong>Select documents</strong>
                          <small>PDF, JPG, JPEG or PNG · up to 5 MB per file</small>
                        </span>
                        <input
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          aria-describedby={fileError ? "file-error" : "file-hint"}
                          aria-invalid={Boolean(fileError)}
                          id="supportingDocuments"
                          multiple
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          type="file"
                        />
                      </label>
                      <p className="request-field-hint" id="file-hint">
                        Files stay in this page only. They are not uploaded or saved. Do not select sensitive documents for this demonstration.
                      </p>
                      <FieldError id="file-error">{fileError}</FieldError>
                      {selectedFiles.length > 0 && (
                        <ul aria-label="Selected supporting documents" className="request-file-list">
                          {selectedFiles.map((file) => (
                            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                              <span className="request-file-type" aria-hidden="true">
                                {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
                              </span>
                              <span className="request-file-details">
                                <strong>{file.name}</strong>
                                <small>{formatFileSize(file.size)}</small>
                              </span>
                              <button
                                aria-label={`Remove ${file.name}`}
                                className="request-file-remove"
                                onClick={() => removeFile(file)}
                                type="button"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </FormSection>

                  <div className="request-form-actions">
                    <Link className="button button--text" href="/citizen/dashboard">
                      Cancel
                    </Link>
                    <button className="button button--navy" type="submit">
                      Review request <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <p className="request-required-note"><span aria-hidden="true">*</span> Required fields</p>
                </>
              ) : (
                <>
                {submitError && (
                  <div className="request-error-summary" role="alert">
                    <strong>Request submission failed.</strong>
                      <span>{submitError}</span>
                  </div>
                )}

                  <FormSection
                    description="Check the details entered in this demonstration form."
                    number="01"
                    title="Applicant information"
                  >
                    <dl className="request-review-grid">
                      <ReviewItem label="Full name">{values.fullName}</ReviewItem>
                      <ReviewItem label="Email address">{values.email}</ReviewItem>
                      <ReviewItem label="Mobile number">{values.mobile}</ReviewItem>
                      <ReviewItem label="Address">
                        {[values.address, values.district, values.state, values.pinCode]
                          .filter(Boolean)
                          .join(", ")}
                      </ReviewItem>
                    </dl>
                  </FormSection>

                  <FormSection
                    description="The department and information requested."
                    number="02"
                    title="Request details"
                  >
                    <dl className="request-review-grid">
                      <ReviewItem label="Public authority">{selectedDepartment?.name}</ReviewItem>
                      <ReviewItem label="Subject">{values.subject}</ReviewItem>
                      <ReviewItem label="Detailed description">
                        <span className="request-review-description">{values.description}</span>
                      </ReviewItem>
                      <ReviewItem label="Relevant date range">
                        {values.dateFrom && values.dateTo
                          ? `${formatDate(values.dateFrom)} – ${formatDate(values.dateTo)}`
                          : "Not specified"}
                      </ReviewItem>
                      <ReviewItem label="Preferred format">
                        {values.responseFormat === "electronic" ? "Electronic" : "Physical"}
                      </ReviewItem>
                      <ReviewItem label="Supporting documents">
                        {selectedFiles.length > 0
                          ? selectedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ")
                          : "None"}
                      </ReviewItem>
                    </dl>
                  </FormSection>

                  <div className="request-declaration">
                    <label htmlFor="declarationAccepted">
                      <input
                        aria-describedby={errors.declaration ? "declaration-error" : undefined}
                        aria-invalid={Boolean(errors.declaration)}
                        checked={declarationAccepted}
                        id="declarationAccepted"
                        onChange={(event) => {
                          setDeclarationAccepted(event.target.checked);
                          if (event.target.checked) {
                            setErrors((current) => {
                              const next = { ...current };
                              delete next.declaration;
                              return next;
                            });
                          }
                        }}
                        type="checkbox"
                      />
                      <span className="request-custom-checkbox" aria-hidden="true" />
                      <span>
                        I confirm that the information provided above is accurate to the best of my knowledge.
                        <small>This declaration is part of the prototype flow only.</small>
                      </span>
                    </label>
                    <FieldError id="declaration-error">{errors.declaration}</FieldError>
                  </div>

                                  <div className="request-form-actions request-review-actions">
                    <button
                      className="button button--text"
                      onClick={() => {
                        setStep("form");
                        setDeclarationAccepted(false);
                        setErrors({});
                        setSubmitError("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">←</span>
                      Back to edit
                    </button>

                    <button
                      className="button button--navy"
                      disabled={!declarationAccepted || isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? "Submitting..." : "Submit request"}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </main>
    </>
  );
}