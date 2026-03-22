import { Link, NavLink, Outlet } from "react-router";

// TODO: loader で認証チェックを実装
// export async function loader({ request }: Route.LoaderArgs) {
//   const currentUser = await container.authProvider.getCurrentUser(request.headers);
//   if (!currentUser) {
//     throw redirect("/admin/login");
//   }
//   return { currentUser };
// }

const navItems = [
  { to: "/admin/tenants", label: "テナント選択" },
  { to: "/admin/invitations", label: "招待一覧" },
  { to: "/admin/notifications", label: "通知" },
  { to: "/admin/profile", label: "プロフィール設定" },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white md:block">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/admin/tenants" className="text-lg font-bold text-primary">
            管理画面
          </Link>
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
            {/* TODO: ユーザー情報、ログアウト */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
