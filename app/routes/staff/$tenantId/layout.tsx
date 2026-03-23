import { data, NavLink, Outlet, redirect, useNavigate } from "react-router";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
import { getTenant } from "@/core/application/tenant/getTenant";
import { authClient } from "@/lib/authClient";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/layout";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  if (members.length === 0) {
    throw redirect("/admin/setup");
  }

  const tenantId = params.tenantId;

  const currentMember = members.find((m) => m.tenantId === tenantId);
  if (!currentMember) {
    throw redirect("/admin/tenants");
  }

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

  const staffProfile = await handleUseCase(() =>
    getStaffProfileByMemberId({
      container,
      headers: request.headers,
      input: { memberId: currentMember.id },
    }),
  ).match(
    (result) => ({
      id: result.id,
      displayName: result.displayName,
    }),
    () => null,
  );

  return {
    tenantId,
    tenantName: tenantResult.name,
    staffDisplayName: staffProfile?.displayName ?? session.user.name ?? "",
    staffProfileId: staffProfile?.id ?? null,
  };
}

export default function StaffLayout({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { tenantId, tenantName, staffDisplayName } = loaderData;
  const basePath = `/staff/${tenantId}`;

  function handleSignOut() {
    authClient.signOut().then(() => {
      navigate("/admin/login");
    });
  }

  const nameInitial = staffDisplayName.charAt(0) || "S";

  const navItems = [
    {
      to: `${basePath}/dashboard`,
      label: "ダッシュボード",
      iconPath:
        "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
    },
    {
      to: `${basePath}/profile`,
      label: "プロフィール編集",
      iconPath:
        "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
    },
    {
      to: `${basePath}/menus`,
      label: "担当メニュー",
      iconPath:
        "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z",
    },
    {
      to: `${basePath}/schedule`,
      label: "スケジュール",
      iconPath:
        "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
    },
    {
      to: `${basePath}/shift-requests`,
      label: "シフト希望",
      iconPath: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
    {
      to: `${basePath}/reservations`,
      label: "予約管理",
      iconPath:
        "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-white">
        <div className="flex h-full items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="font-heading text-lg font-semibold tracking-tight text-neutral-900 no-underline"
            >
              <span className="text-primary">dot.</span>reservation
            </a>
            <span className="border-l border-border pl-8 text-sm text-text-secondary">
              {tenantName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-10 items-center gap-2 rounded-[10px] border-none bg-transparent px-4 text-sm font-medium text-text transition-colors duration-150 hover:bg-surface-secondary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light text-xs font-medium text-secondary">
                {nameInitial}
              </span>
              {staffDisplayName}
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-text-muted"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[260px] shrink-0 overflow-y-auto border-r border-border bg-white py-6 md:block">
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium no-underline transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-lighter text-primary"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text"
                  }`
                }
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] shrink-0"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.iconPath}
                  />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 bg-surface p-8">
          <div className="max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="ml-[260px] flex items-center justify-between px-10 py-6">
          <span className="text-sm font-semibold text-text-muted no-underline">
            <span className="text-primary">dot.</span>reservation
          </span>
          <p className="text-xs text-text-muted">
            &copy; 2026 dot.reservation All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
