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
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-bg-section)" }}
    >
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--color-bg-page)",
          borderBottom: "1px solid var(--color-neutral-300)",
        }}
      >
        <div
          className="mx-auto flex h-16 items-center"
          style={{ maxWidth: "1280px", padding: "0 var(--space-2xl)" }}
        >
          <Link
            to="/"
            className="font-semibold no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-lg)",
              color: "var(--color-neutral-900)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            <span style={{ color: "var(--color-primary)" }}>dot.</span>
            reservation
          </Link>
        </div>
      </header>

      <main
        className="flex flex-1 items-center justify-center"
        style={{ padding: "var(--space-3xl) var(--space-xl)" }}
      >
        <div
          className="w-full"
          style={{
            maxWidth: "480px",
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-neutral-300)",
            padding: "var(--space-2xl)",
          }}
        >
          {badge && (
            <div className="text-center">
              <span
                className="inline-flex items-center font-medium"
                style={{
                  padding: "4px 12px",
                  background: "var(--color-primary-lighter)",
                  color: "var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "var(--tracking-wide)",
                  marginBottom: "var(--space-md)",
                }}
              >
                {badge}
              </span>
            </div>
          )}

          <h1
            className="text-center font-semibold"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-2xl)",
              color: "var(--color-neutral-900)",
              letterSpacing: "var(--tracking-tight)",
              lineHeight: "var(--leading-tight)",
              marginBottom: description ? "var(--space-sm)" : "var(--space-xl)",
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              className="text-center"
              style={{
                fontSize: "var(--text-base)",
                color: "var(--color-neutral-600)",
                lineHeight: "var(--leading-normal)",
                marginBottom: "var(--space-xl)",
              }}
            >
              {description}
            </p>
          )}

          {children}
        </div>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--color-neutral-300)",
          background: "var(--color-bg-page)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{
            maxWidth: "1280px",
            padding: "var(--space-xl) var(--space-2xl)",
          }}
        >
          <Link
            to="/"
            className="font-semibold no-underline"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-base)",
              color: "var(--color-neutral-500)",
            }}
          >
            <span style={{ color: "var(--color-primary)" }}>dot.</span>
            reservation
          </Link>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-500)",
            }}
          >
            &copy; 2026 dot.reservation All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
