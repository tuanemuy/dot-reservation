import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-text-secondary",
  primary: "bg-primary/10 text-primary-dark",
  accent: "bg-accent/10 text-accent-dark",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
