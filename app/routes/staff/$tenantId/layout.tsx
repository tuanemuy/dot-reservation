import { NavLink, Outlet, useParams } from "react-router";

// TODO: loader で認証チェック

export default function StaffLayout() {
  const { tenantId } = useParams();
  const basePath = `/staff/${tenantId}`;

  const navItems = [
    { to: `${basePath}/dashboard`, label: "ダッシュボード" },
    { to: `${basePath}/reservations`, label: "予約管理" },
    { to: `${basePath}/schedule`, label: "スケジュール" },
    { to: `${basePath}/shift-requests`, label: "シフト希望" },
    { to: `${basePath}/menus`, label: "担当メニュー" },
    { to: `${basePath}/profile`, label: "プロフィール" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-white md:block">
        <div className="flex h-16 items-center border-b border-border px-4">
          <p className="text-lg font-bold text-primary">スタッフ</p>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary"
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
        <header className="flex h-14 items-center border-b border-border bg-white px-6 md:hidden">
          <p className="text-sm font-semibold text-primary">スタッフ</p>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
