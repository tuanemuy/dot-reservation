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
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-primary">
          dot-reservation
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                to="/mypage/reservations"
                className="text-sm text-text-secondary hover:text-text"
              >
                マイページ
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-text-secondary hover:text-text"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                to="/customer/login"
                className="text-sm text-text-secondary hover:text-text"
              >
                ログイン
              </Link>
              <Link
                to="/customer/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} dot-reservation
          </p>
          <nav className="flex gap-6">
            <Link
              to="/"
              className="text-sm text-text-secondary hover:text-text"
            >
              トップ
            </Link>
            <Link
              to="/search"
              className="text-sm text-text-secondary hover:text-text"
            >
              店舗検索
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
