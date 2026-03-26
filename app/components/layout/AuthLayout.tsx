import { Link } from "react-router";

type AuthLayoutProps = {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly badge?: string;
};

export function AuthLayout({
  children,
  title,
  description,
  badge,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-neutral-300 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-10">
          <Link
            to="/"
            className="font-heading text-lg font-semibold tracking-tight text-neutral-900 no-underline"
          >
            <span className="text-primary">dot.</span>
            reservation
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-8 py-14">
        <div className="w-full max-w-[480px] rounded-lg border border-neutral-300 bg-white p-10">
          {badge && (
            <div className="text-center">
              <span className="mb-4 inline-flex items-center rounded-full bg-primary-lighter px-3 py-1 text-xs font-medium tracking-wide text-primary">
                {badge}
              </span>
            </div>
          )}

          <h1
            className={`text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900 ${description ? "mb-2" : "mb-8"}`}
          >
            {title}
          </h1>

          {description && (
            <p className="mb-8 text-center text-base leading-normal text-neutral-600">
              {description}
            </p>
          )}

          {children}
        </div>
      </main>

      <footer className="border-t border-neutral-300 bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-10 py-8">
          <Link
            to="/"
            className="font-heading text-base font-semibold text-neutral-500 no-underline"
          >
            <span className="text-primary">dot.</span>
            reservation
          </Link>
          <p className="text-xs text-neutral-500">
            &copy; 2026 dot.reservation All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
