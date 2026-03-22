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
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
