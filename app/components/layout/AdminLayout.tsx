import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { authClient } from "@/lib/authClient";

type AdminLayoutProps = {
  children: ReactNode;
  tenantId?: string;
};

const commonNavItems = [
  { to: "/admin/tenants", label: "テナント選択" },
  { to: "/admin/invitations", label: "招待一覧" },
  { to: "/admin/profile", label: "プロフィール" },
  { to: "/admin/notifications", label: "通知" },
];

function getTenantNavItems(tenantId: string) {
  return [
    { to: `/admin/${tenantId}/dashboard`, label: "ダッシュボード" },
    { to: `/admin/${tenantId}/reservations`, label: "予約管理" },
    { to: `/admin/${tenantId}/menus`, label: "メニュー管理" },
    { to: `/admin/${tenantId}/staff`, label: "スタッフ管理" },
    { to: `/admin/${tenantId}/shifts`, label: "シフト管理" },
    { to: `/admin/${tenantId}/members`, label: "メンバー管理" },
    { to: `/admin/${tenantId}/business-hours`, label: "営業設定" },
    { to: `/admin/${tenantId}/reservation-settings`, label: "予約設定" },
    { to: `/admin/${tenantId}/settings`, label: "テナント設定" },
  ];
}

export function AdminLayout({ children, tenantId }: AdminLayoutProps) {
  const navigate = useNavigate();
  const navItems = tenantId ? getTenantNavItems(tenantId) : commonNavItems;

  function handleSignOut() {
    authClient.signOut().then(() => {
      navigate("/admin/login");
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/admin/tenants" className="text-lg font-bold text-primary">
            管理画面
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
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
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-secondary hover:text-text"
          >
            ログアウト
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
          <div className="md:hidden">
            <Link
              to="/admin/tenants"
              className="text-lg font-bold text-primary"
            >
              管理画面
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-text-secondary hover:text-text md:hidden"
            >
              ログアウト
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
