import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="mb-8 rounded-lg border border-neutral-300 bg-white">
      <div className="mb-4 flex items-center justify-between px-6 pt-6">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-800">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
