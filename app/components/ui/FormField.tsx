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
    <div className="mb-6">
      <label
        htmlFor={htmlFor}
        className="block font-medium text-sm text-neutral-700 mb-2 tracking-wide"
      >
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {errorMessage && (
        <div className="flex items-center gap-1 mt-2 text-sm text-error">
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0 size-3.5"
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
