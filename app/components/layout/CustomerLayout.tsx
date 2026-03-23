import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { authClient } from "@/lib/authClient";

type CustomerLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { to: "/mypage/reservations", label: "予約一覧" },
  { to: "/mypage/notifications", label: "通知" },
  { to: "/mypage/profile", label: "プロフィール" },
  { to: "/mypage/notifications/settings", label: "通知設定" },
];

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            dot-reservation
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-text-secondary hover:text-text"
            >
              トップへ
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-text-secondary hover:text-text"
            >
              ログアウト
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 py-6 md:gap-8">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
