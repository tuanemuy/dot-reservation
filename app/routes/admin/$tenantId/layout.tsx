import { data, Link, NavLink, Outlet, useParams } from "react-router";
import { getTenant } from "@/core/application/tenant/getTenant";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/layout";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;

  const tenantResult = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    tenant: tenantResult,
  };
}

export default function TenantAdminLayout({
  loaderData,
}: Route.ComponentProps) {
  const { tenantId } = useParams();
  const basePath = `/admin/${tenantId}`;
  const { tenant } = loaderData;

  const navItems = [
    { to: `${basePath}/dashboard`, label: "ダッシュボード" },
    { to: `${basePath}/reservations`, label: "予約管理" },
    { to: `${basePath}/menus`, label: "メニュー管理" },
    { to: `${basePath}/staff`, label: "スタッフ管理" },
    { to: `${basePath}/shifts`, label: "シフト管理" },
    { to: `${basePath}/business-hours`, label: "営業設定" },
    { to: `${basePath}/reservation-settings`, label: "予約設定" },
    { to: `${basePath}/members`, label: "メンバー管理" },
    { to: `${basePath}/settings`, label: "テナント設定" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white md:block">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link
            to="/admin/tenants"
            className="text-sm text-text-secondary hover:text-text"
          >
            &larr; テナント一覧
          </Link>
        </div>

        <div className="px-4 py-3">
          <h2 className="text-lg font-bold">{tenant.name}</h2>
        </div>

        <nav className="space-y-1 px-3">
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

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <NavLink
            to="/admin/notifications"
            className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text"
          >
            通知
          </NavLink>
          <NavLink
            to="/admin/profile"
            className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text"
          >
            プロフィール
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
          <div className="md:hidden">
            <Link
              to="/admin/tenants"
              className="text-lg font-bold text-primary"
            >
              {tenant.name}
            </Link>
          </div>
          <div className="flex items-center gap-4" />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
