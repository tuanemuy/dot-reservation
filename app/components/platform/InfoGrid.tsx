import type { ReactNode } from "react";

type InfoGridProps = {
  children: ReactNode;
};

export function InfoGrid({ children }: InfoGridProps) {
  return <div className="grid grid-cols-2 px-6 pb-6">{children}</div>;
}
