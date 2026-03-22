import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className = "", error, ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-surface-secondary disabled:opacity-70 ${
        error ? "border-destructive" : "border-border"
      } ${className}`}
      {...props}
    />
  );
}
