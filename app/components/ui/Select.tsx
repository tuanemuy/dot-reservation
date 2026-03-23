import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export function Select({
  className = "",
  error,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={`w-full appearance-none rounded-md border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-surface-secondary disabled:opacity-70 ${
        error ? "border-destructive" : "border-border"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
