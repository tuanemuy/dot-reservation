import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`border-t border-border px-5 py-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
