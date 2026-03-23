import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string | string[];
  required?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: FormFieldProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div style={{ marginBottom: "var(--space-lg)" }}>
      <label
        htmlFor={htmlFor}
        className="block font-medium"
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-neutral-700)",
          marginBottom: "var(--space-sm)",
          letterSpacing: "var(--tracking-wide)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-error)", marginLeft: "2px" }}>
            *
          </span>
        )}
      </label>
      {children}
      {errorMessage && (
        <div
          className="flex items-center"
          style={{
            gap: "var(--space-xs)",
            marginTop: "var(--space-sm)",
            fontSize: "var(--text-sm)",
            color: "var(--color-error)",
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "14px", height: "14px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
