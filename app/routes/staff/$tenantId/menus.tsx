import { data, redirect } from "react-router";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/menus";

type AssignedMenu = {
  id: string;
  name: string;
  category: string | null;
  duration: number;
  price: number;
  description: string | null;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const currentMember = members.find((m) => m.tenantId === tenantId);
  if (!currentMember) {
    throw redirect("/admin/tenants");
  }

  const myProfile = await handleUseCase(() =>
    getStaffProfileByMemberId({
      container,
      headers: request.headers,
      input: { memberId: currentMember.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const allMenusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result.items,
    () => [] as MenuDetail[],
  );

  const assignedMenuIds = new Set(myProfile.assignedMenus.map((m) => m.id));

  const menus: AssignedMenu[] = allMenusResult
    .filter((m) => assignedMenuIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      duration: m.duration,
      price: m.price,
      description: m.description,
    }));

  return { menus };
}

export default function StaffMenusPage({ loaderData }: Route.ComponentProps) {
  const { menus } = loaderData;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          担当メニュー
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          現在担当しているメニューの一覧です
        </p>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-white p-8 text-center">
          <p className="text-sm text-text-secondary">
            担当メニューが設定されていません。
          </p>
          <p className="mt-1 text-xs text-text-muted">
            管理者にお問い合わせください。
          </p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="rounded-[14px] border border-border bg-white p-6 transition-all duration-150 hover:border-neutral-400 hover:shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="font-heading text-lg font-semibold tracking-tight text-neutral-900">
                  {menu.name}
                </h3>
                {menu.category && (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary-lighter px-2.5 py-0.5 text-xs font-medium text-primary">
                    {menu.category}
                  </span>
                )}
              </div>
              <div className="mb-4 flex gap-6">
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  {menu.duration}分
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-accent-dark">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  {menu.price.toLocaleString()}円
                </div>
              </div>
              {menu.description && (
                <p className="text-sm leading-[1.9] text-text-secondary">
                  {menu.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-center gap-2 rounded-[14px] border border-border bg-surface px-6 py-4">
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px] shrink-0 text-info"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
        <span className="text-sm text-text-secondary">
          担当メニューの変更は管理者にお問い合わせください
        </span>
      </div>
    </div>
  );
}
