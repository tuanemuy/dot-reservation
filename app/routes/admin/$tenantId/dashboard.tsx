import { data, Link, redirect } from "react-router";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listPendingInvitations } from "@/core/application/member/listPendingInvitations";
import { listMenus } from "@/core/application/menu/listMenus";
import { listReservations } from "@/core/application/reservation/listReservations";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import { getTenant } from "@/core/application/tenant/getTenant";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/dashboard";

type SetupStatus = {
  hasBusinessHours: boolean;
  hasMenus: boolean;
  hasStaff: boolean;
  isFullySetUp: boolean;
};

function checkBusinessHours(
  businessHours: Record<number, { open: string; close: string } | null>,
): boolean {
  return Object.values(businessHours).some((hours) => hours !== null);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const tenantId = params.tenantId;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const todayReservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: null,
        startDate: dateStr,
        endDate: dateStr,
        page: 1,
        limit: 50,
      },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const pendingReservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: "pending",
        startDate: null,
        endDate: null,
        page: 1,
        limit: 1,
      },
    }),
  ).match(
    (result) => result,
    () => ({ items: [], totalCount: 0 }),
  );

  const [tenantResult, menusResult, staffResult] = await Promise.all([
    handleUseCase(() =>
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
    ),
    handleUseCase(() =>
      listMenus({
        container,
        headers: request.headers,
        input: { tenantId },
      }),
    ).match(
      (result) => result,
      () => ({ items: [] }),
    ),
    handleUseCase(() =>
      listStaffProfiles({
        container,
        headers: request.headers,
        input: { tenantId },
      }),
    ).match(
      (result) => result,
      () => ({ items: [] }),
    ),
  ]);

  const hasBusinessHours = checkBusinessHours(tenantResult.businessHours);
  const hasMenus = menusResult.items.length > 0;
  const hasStaff = staffResult.items.length > 0;

  const setupStatus: SetupStatus = {
    hasBusinessHours,
    hasMenus,
    hasStaff,
    isFullySetUp: hasBusinessHours && hasMenus && hasStaff,
  };

  const pendingInvitationsResult = await handleUseCase(() =>
    listPendingInvitations({
      container,
      headers: request.headers,
      input: { email: session.user.email },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  return {
    todayReservations: todayReservationsResult.items,
    pendingCount: pendingReservationsResult.totalCount,
    setupStatus,
    pendingInvitationCount: pendingInvitationsResult.items.length,
  };
}

export default function TenantDashboardPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    todayReservations,
    pendingCount,
    setupStatus,
    pendingInvitationCount,
  } = loaderData;
  const tenantId = params.tenantId;

  return (
    <div>
      <h1 className="mb-8 font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
        ダッシュボード
      </h1>

      {pendingInvitationCount > 0 && (
        <div className="mb-6 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-info"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <p className="text-sm font-medium text-info">
                {pendingInvitationCount}件の未対応の招待があります
              </p>
            </div>
            <Link
              to="/admin/invitations"
              className="text-sm font-medium text-info underline"
            >
              確認する
            </Link>
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-warning"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-warning">
                承認待ちの予約が {pendingCount} 件あります
              </p>
            </div>
            <Link
              to={`/admin/${tenantId}/reservations?status=pending`}
              className="text-sm font-medium text-warning underline"
            >
              確認する
            </Link>
          </div>
        </div>
      )}

      {!setupStatus.isFullySetUp && (
        <SetupGuide tenantId={tenantId} setupStatus={setupStatus} />
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-neutral-800">
            本日の予約
          </h2>
          <Link
            to={`/admin/${tenantId}/reservations`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            すべての予約を見る
          </Link>
        </div>

        {todayReservations.length === 0 ? (
          <div className="rounded-lg border border-neutral-300 bg-white p-14 text-center">
            <p className="text-base text-neutral-500">本日の予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-neutral-200 px-6 py-4 text-left text-xs font-medium tracking-wide text-neutral-500">
                    時間
                  </th>
                  <th className="border-b border-neutral-200 px-6 py-4 text-left text-xs font-medium tracking-wide text-neutral-500">
                    顧客名
                  </th>
                  <th className="border-b border-neutral-200 px-6 py-4 text-left text-xs font-medium tracking-wide text-neutral-500">
                    メニュー
                  </th>
                  <th className="border-b border-neutral-200 px-6 py-4 text-left text-xs font-medium tracking-wide text-neutral-500">
                    担当
                  </th>
                  <th className="border-b border-neutral-200 px-6 py-4 text-left text-xs font-medium tracking-wide text-neutral-500">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayReservations.map((reservation, i) => (
                  <tr
                    key={reservation.id}
                    className={`transition-colors hover:bg-neutral-50 ${
                      i < todayReservations.length - 1
                        ? "border-b border-neutral-200"
                        : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                      {reservation.startTime}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                      {reservation.customerName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                      {reservation.menuName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-800">
                      {reservation.staffName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge
                        status={reservation.status}
                        variant="reservation"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const setupItems = [
  {
    key: "settings",
    label: "テナント設定",
    description: "店舗名・住所・電話番号などの基本情報を設定します",
    path: "settings",
    isAlwaysComplete: true,
  },
  {
    key: "businessHours",
    label: "営業時間設定",
    description: "曜日ごとの営業時間と定休日を設定します",
    path: "business-hours",
    statusKey: "hasBusinessHours" as const,
  },
  {
    key: "menus",
    label: "メニュー管理",
    description: "提供するメニューとその所要時間・料金を登録します",
    path: "menus",
    statusKey: "hasMenus" as const,
  },
  {
    key: "staff",
    label: "スタッフ管理",
    description: "スタッフのプロフィールを登録します",
    path: "staff",
    statusKey: "hasStaff" as const,
  },
  {
    key: "reservationSettings",
    label: "予約設定",
    description: "予約の受付期間や承認方法などを設定します",
    path: "reservation-settings",
    isAlwaysComplete: true,
  },
] as const;

function isItemComplete(
  item: (typeof setupItems)[number],
  setupStatus: SetupStatus,
): boolean {
  if ("isAlwaysComplete" in item && item.isAlwaysComplete) {
    return true;
  }
  if ("statusKey" in item) {
    return setupStatus[item.statusKey];
  }
  return false;
}

function SetupGuide({
  tenantId,
  setupStatus,
}: {
  tenantId: string;
  setupStatus: SetupStatus;
}) {
  const completedCount = setupItems.filter((item) =>
    isItemComplete(item, setupStatus),
  ).length;

  return (
    <section className="mb-8">
      <div className="rounded-lg border border-neutral-300 bg-white">
        <div className="border-b border-neutral-200 px-8 py-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-800">
            セットアップガイド
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            予約の受付を開始するために、以下の設定を完了してください（
            {completedCount}/{setupItems.length}）
          </p>
        </div>

        <ul className="divide-y divide-neutral-200">
          {setupItems.map((item, index) => {
            const completed = isItemComplete(item, setupStatus);
            return (
              <li key={item.key}>
                <Link
                  to={`/admin/${tenantId}/${item.path}`}
                  className="flex items-start gap-4 px-8 py-6 transition-colors hover:bg-neutral-50"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                    {completed ? (
                      <svg
                        className="h-5 w-5 text-success"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-neutral-300 text-xs font-medium text-neutral-400">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        completed ? "text-neutral-500" : "text-neutral-800"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {item.description}
                    </p>
                  </div>

                  {!completed && (
                    <span className="mt-0.5 shrink-0 text-xs font-medium text-primary">
                      設定する
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
