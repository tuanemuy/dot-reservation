import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

type StaffLayoutProps = {
  children: ReactNode;
  tenantId: string;
};

function getNavItems(tenantId: string) {
  return [
    { to: `/staff/${tenantId}/dashboard`, label: "ダッシュボード" },
    { to: `/staff/${tenantId}/reservations`, label: "予約管理" },
    { to: `/staff/${tenantId}/schedule`, label: "スケジュール" },
    { to: `/staff/${tenantId}/shift-requests`, label: "シフト希望" },
    { to: `/staff/${tenantId}/menus`, label: "担当メニュー" },
    { to: `/staff/${tenantId}/profile`, label: "プロフィール" },
  ];
}

export function StaffLayout({ children, tenantId }: StaffLayoutProps) {
  const navItems = getNavItems(tenantId);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-white md:block">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link
            to={`/staff/${tenantId}/dashboard`}
            className="text-lg font-bold text-primary"
          >
            スタッフ画面
          </Link>
        </div>
        <nav className="space-y-1 p-3">
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

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
          <div className="md:hidden">
            <Link
              to={`/staff/${tenantId}/dashboard`}
              className="text-lg font-bold text-primary"
            >
              スタッフ画面
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {/* TODO: ユーザー情報 */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
