import { Link } from "react-router";

export function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-primary">
          dot-reservation
        </Link>

        <nav className="flex items-center gap-4">
          {/* TODO: 認証状態に応じてリンクを切り替える */}
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
        </nav>
      </div>
    </header>
  );
}
