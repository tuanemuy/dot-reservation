import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "destructive-outline"
  | "warning-outline"
  | "error-outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:scale-[0.99]",
  secondary:
    "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:scale-[0.99]",
  outline:
    "bg-transparent text-neutral-800 border border-neutral-300 hover:bg-neutral-100 active:scale-[0.99]",
  ghost:
    "bg-transparent text-neutral-800 border-0 hover:bg-neutral-100 active:scale-[0.99]",
  destructive: "bg-error text-white hover:opacity-90 active:scale-[0.99]",
  "destructive-outline":
    "bg-white text-error border border-error hover:opacity-90 active:scale-[0.99]",
  "warning-outline":
    "bg-white text-warning border border-warning hover:opacity-90 active:scale-[0.99]",
  "error-outline":
    "bg-white text-error border border-error hover:opacity-90 active:scale-[0.99]",
};

const disabledClasses = "bg-neutral-300 text-neutral-500 cursor-not-allowed";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9",
  md: "h-11",
  lg: "h-12",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary px-8 rounded-md font-body text-base tracking-wide cursor-pointer ${sizeClasses[size]} ${disabled ? disabledClasses : variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
