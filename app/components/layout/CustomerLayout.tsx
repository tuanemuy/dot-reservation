import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { authClient } from "@/lib/authClient";

type CustomerLayoutProps = {
  children: ReactNode;
};

const navItems = [
  {
    to: "/mypage/reservations",
    label: "予約一覧",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      </svg>
    ),
  },
  {
    to: "/mypage/notifications",
    label: "通知",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
    ),
  },
  {
    to: "/mypage/profile",
    label: "プロフィール設定",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    ),
  },
  {
    to: "/mypage/notifications/settings",
    label: "通知設定",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "1px solid var(--color-neutral-300)" }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{
            maxWidth: "1280px",
            padding: "0 var(--space-2xl)",
            height: "64px",
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-lg)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-neutral-900)",
              textDecoration: "none",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            <span style={{ color: "var(--color-primary)" }}>dot.</span>
            reservation
          </Link>
          <div className="flex items-center" style={{ gap: "var(--space-sm)" }}>
            <Link
              to="/"
              className="hover-icon-button flex items-center justify-center"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                color: "var(--color-neutral-500)",
              }}
              aria-label="検索"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{ width: "20px", height: "20px" }}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hover-icon-button flex items-center justify-center"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-neutral-500)",
              }}
              aria-label="ログアウト"
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{ width: "20px", height: "20px" }}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "1280px",
          padding: "0 var(--space-2xl)",
        }}
      >
        {/* Mypage Layout: sidebar + content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: "var(--space-2xl)",
            paddingBottom: "var(--space-section)",
            paddingTop: "var(--space-md)",
          }}
        >
          {/* Sidebar */}
          <aside style={{ paddingTop: "var(--space-sm)" }}>
            <nav className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/mypage/notifications"}
                  className={({ isActive }) =>
                    `mypage-sidebar-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main style={{ minWidth: 0 }}>{children}</main>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--color-neutral-300)",
          marginTop: "auto",
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
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-neutral-500)",
              textDecoration: "none",
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
