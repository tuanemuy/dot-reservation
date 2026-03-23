import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { authClient } from "@/lib/authClient";

type PublicLayoutProps = {
  children: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  function handleSignOut() {
    authClient.signOut().then(() => {
      navigate("/");
    });
  }

  return (
    <header
      className="sticky top-0 z-100 border-b border-neutral-300 bg-[var(--color-bg-page)]"
      style={{ zIndex: 100 }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: 1280,
          padding: "0 var(--space-2xl)",
          height: 64,
        }}
      >
        <Link
          to="/"
          className="font-[var(--font-heading)] text-neutral-900 no-underline"
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          <span className="text-primary">dot.</span>reservation
        </Link>
        <div className="flex items-center gap-[var(--space-sm)]">
          <Link
            to="/search"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-none bg-transparent text-neutral-500 transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="検索"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <title>検索</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </Link>

          {session ? (
            <>
              <Link
                to="/mypage/reservations"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-none bg-transparent text-neutral-500 transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="マイページ"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <title>マイページ</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex h-10 cursor-pointer items-center rounded-[var(--radius-md)] border-none bg-transparent px-[var(--space-sm)] text-neutral-500 transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              to="/customer/login"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-none bg-transparent text-neutral-500 transition-[background,color] duration-[0.15s] ease-[ease] hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="マイページ"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <title>マイページ</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-300">
      <div
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: 1280,
          padding: "var(--space-xl) var(--space-2xl)",
        }}
      >
        <Link
          to="/"
          className="font-[var(--font-heading)] text-neutral-500 no-underline"
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          <span className="text-primary">dot.</span>reservation
        </Link>
        <p className="text-neutral-500" style={{ fontSize: "var(--text-xs)" }}>
          &copy; {new Date().getFullYear()} dot.reservation All rights reserved.
        </p>
      </div>
    </footer>
  );
}
