import { data, Link, NavLink, Outlet, redirect } from "react-router";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/layout";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const { listMembers } = await import("@/core/application/member/listMembers");

  // Check authentication - in a real app, this would use authProvider
  // For now, we verify the tenant exists and has members
  const tenantId = params.tenantId;

  const membersResult = await handleUseCase(() =>
    listMembers({
      container,
      headers: request.headers,
      input: { tenantId, role: "staff" },
    }),
  ).match(
    (result) => result,
    (e) => {
      if (e.status === 401) {
        throw redirect("/admin/login");
      }
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    tenantId,
    staffCount: membersResult.items.length,
  };
}

export default function StaffLayout({ loaderData }: Route.ComponentProps) {
  const { tenantId } = loaderData;
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
          <Link
            to="/admin/tenants"
            className="text-sm text-text-secondary hover:text-text"
          >
            &larr; テナント一覧
          </Link>
        </div>

        <div className="px-4 py-3">
          <h2 className="text-lg font-bold text-primary">スタッフ</h2>
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
