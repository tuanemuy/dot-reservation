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
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-neutral-300 bg-white">
        <div className="flex h-full items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/platform/dashboard"
              className="font-heading text-lg font-semibold tracking-tight text-neutral-900 no-underline"
            >
              <span className="text-primary">dot.</span>
              reservation
            </Link>
            <span className="border-l border-neutral-300 pl-8 text-sm text-neutral-600">
              プラットフォーム管理
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-4 font-body text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-200"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light text-xs font-medium text-secondary">
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
                  className="h-3.5 w-3.5 text-neutral-500"
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
        <aside className="sticky top-16 h-[calc(100vh-64px)] w-[260px] shrink-0 overflow-y-auto border-r border-neutral-300 bg-white py-6">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium no-underline transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-lighter text-primary"
                      : "text-neutral-600 hover:bg-surface-secondary hover:text-text"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 max-w-[1280px] flex-1 px-10 py-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-300 bg-white">
        <div className="ml-[260px] flex items-center justify-between px-10 py-6">
          <span className="text-sm font-semibold text-neutral-500 no-underline">
            <span className="text-primary">dot.</span>
            reservation
          </span>
          <p className="text-xs text-neutral-500">
            &copy; 2026 dot.reservation All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
