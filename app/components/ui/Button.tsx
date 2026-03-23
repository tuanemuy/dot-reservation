import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<
  ButtonVariant,
  { background: string; color: string; border?: string }
> = {
  primary: { background: "var(--color-primary)", color: "#FFFFFF" },
  secondary: {
    background: "var(--color-neutral-200)",
    color: "var(--color-neutral-800)",
  },
  outline: {
    background: "transparent",
    color: "var(--color-neutral-800)",
    border: "1px solid var(--color-neutral-300)",
  },
  ghost: { background: "transparent", color: "var(--color-neutral-800)" },
  destructive: { background: "var(--color-error)", color: "#FFFFFF" },
};

const sizeHeights: Record<ButtonSize, string> = {
  sm: "36px",
  md: "44px",
  lg: "48px",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors ${className}`}
      disabled={disabled}
      style={{
        height: sizeHeights[size],
        padding: "0 var(--space-xl)",
        background: disabled ? "var(--color-neutral-300)" : vs.background,
        color: disabled ? "var(--color-neutral-500)" : vs.color,
        border: vs.border ?? "none",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-base)",
        letterSpacing: "var(--tracking-wide)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: 1,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
