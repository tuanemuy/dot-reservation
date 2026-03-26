import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
        {title}
      </h1>
      {children}
    </div>
  );
}
