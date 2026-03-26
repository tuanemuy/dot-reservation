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
    <header className="sticky top-0 z-100 border-b border-neutral-300 bg-white">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-10">
        <Link
          to="/"
          className="font-heading text-lg font-semibold tracking-tight text-neutral-900 no-underline"
        >
          <span className="text-primary">dot.</span>reservation
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-neutral-500 transition-[background,color] duration-150 hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-neutral-500 transition-[background,color] duration-150 hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                className="flex h-10 cursor-pointer items-center rounded-md border-none bg-transparent px-2 text-sm font-medium text-neutral-500 transition-[background,color] duration-150 hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              to="/customer/login"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-neutral-500 transition-[background,color] duration-150 hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-10 py-8">
        <Link
          to="/"
          className="font-heading text-base font-semibold text-neutral-500 no-underline"
        >
          <span className="text-primary">dot.</span>reservation
        </Link>
        <p className="text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} dot.reservation All rights reserved.
        </p>
      </div>
    </footer>
  );
}
