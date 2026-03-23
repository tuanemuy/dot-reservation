import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { authClient } from "@/lib/authClient";

type PlatformLayoutProps = {
  children: ReactNode;
  userEmail: string;
};

const navItems = [
  {
    to: "/platform/dashboard",
    label: "ダッシュボード",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-[18px] shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
        />
      </svg>
    ),
  },
  {
    to: "/platform/tenants",
    label: "テナント管理",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-[18px] shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
        />
      </svg>
    ),
  },
  {
    to: "/platform/users",
    label: "ユーザー管理",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-[18px] shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  },
];

function getUserInitial(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function PlatformLayout({ children, userEmail }: PlatformLayoutProps) {
  const navigate = useNavigate();

  function handleSignOut() {
    authClient.signOut().then(() => {
      navigate("/platform/login");
    });
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-bg-section)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--color-bg-page)",
          borderBottom: "1px solid var(--color-neutral-300)",
          height: "64px",
        }}
      >
        <div
          className="flex h-full items-center justify-between"
          style={{ padding: "0 var(--space-xl)" }}
        >
          <div className="flex items-center" style={{ gap: "var(--space-xl)" }}>
            <Link
              to="/platform/dashboard"
              className="no-underline"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-lg)",
                fontWeight: 600,
                color: "var(--color-neutral-900)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              <span style={{ color: "var(--color-primary)" }}>dot.</span>
              reservation
            </Link>
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-neutral-600)",
                fontWeight: 400,
                paddingLeft: "var(--space-xl)",
                borderLeft: "1px solid var(--color-neutral-300)",
              }}
            >
              プラットフォーム管理
            </span>
          </div>
          <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
            <button
              type="button"
              onClick={handleSignOut}
              className="hover-bg-neutral-200 flex cursor-pointer items-center border-none bg-transparent"
              style={{
                gap: "var(--space-sm)",
                height: "40px",
                padding: "0 var(--space-md)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-neutral-700)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
              }}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-full)",
                  background:
                    "linear-gradient(135deg, var(--color-secondary-lighter), var(--color-secondary-light))",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  color: "var(--color-secondary)",
                }}
              >
                {getUserInitial(userEmail)}
              </span>
              管理者
              <span>
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="shrink-0 overflow-y-auto"
          style={{
            width: "260px",
            background: "var(--color-bg-page)",
            borderRight: "1px solid var(--color-neutral-300)",
            padding: "var(--space-lg) 0",
            height: "calc(100vh - 64px)",
            position: "sticky",
            top: "64px",
          }}
        >
          <nav
            className="flex flex-col"
            style={{ gap: "2px", padding: "0 var(--space-sm)" }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="no-underline"
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--color-neutral-600)",
                  background: isActive
                    ? "var(--color-primary-lighter)"
                    : "transparent",
                  textDecoration: "none",
                  transition:
                    "background var(--transition-default), color var(--transition-default)",
                  cursor: "pointer",
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className="min-w-0 flex-1"
          style={{
            padding: "var(--space-xl) var(--space-2xl)",
            maxWidth: "1280px",
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--color-neutral-300)",
          background: "var(--color-bg-page)",
          marginTop: "auto",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "var(--space-lg) var(--space-2xl)",
            marginLeft: "260px",
          }}
        >
          <span
            className="no-underline"
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-neutral-500)",
            }}
          >
            <span style={{ color: "var(--color-primary)" }}>dot.</span>
            reservation
          </span>
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
