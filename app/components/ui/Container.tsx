import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export function Container({ children }: ContainerProps) {
  return <div className="mx-auto max-w-[1280px] px-10">{children}</div>;
}
