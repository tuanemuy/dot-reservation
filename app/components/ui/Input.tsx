import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className = "", error, ...props }: InputProps) {
  return (
    <input
      className={`w-full transition-colors focus:outline-none disabled:cursor-not-allowed ${className}`}
      style={{
        height: "44px",
        padding: "0 var(--space-md)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-base)",
        fontWeight: "var(--weight-normal)" as unknown as number,
        color: props.disabled
          ? "var(--color-neutral-500)"
          : "var(--color-neutral-900)",
        background: props.disabled
          ? "var(--color-neutral-100)"
          : "var(--color-bg-page)",
        border: `1px solid ${error ? "var(--color-error)" : "var(--color-neutral-300)"}`,
        borderRadius: "var(--radius-md)",
      }}
      {...props}
    />
  );
}
