import { data, Link } from "react-router";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listReservations } from "@/core/application/reservation/listReservations";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/dashboard";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

  return {
    todayReservations: todayReservationsResult.items,
    pendingCount: pendingReservationsResult.totalCount,
  };
}

export default function TenantDashboardPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { todayReservations, pendingCount } = loaderData;
  const tenantId = params.tenantId;

  return (
    <div>
      <h1 className="mb-[var(--space-xl)] font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
        ダッシュボード
      </h1>

      {pendingCount > 0 && (
        <div className="mb-[var(--space-lg)] rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-[var(--space-xl)] py-[var(--space-md)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-sm)]">
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
              <p className="text-[length:var(--text-sm)] font-[var(--weight-medium)] text-warning">
                承認待ちの予約が {pendingCount} 件あります
              </p>
            </div>
            <Link
              to={`/admin/${tenantId}/reservations?status=pending`}
              className="text-[length:var(--text-sm)] font-[var(--weight-medium)] text-warning underline"
            >
              確認する
            </Link>
          </div>
        </div>
      )}

      <section>
        <div className="mb-[var(--space-md)] flex items-center justify-between">
          <h2 className="font-[var(--font-heading)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
            本日の予約
          </h2>
          <Link
            to={`/admin/${tenantId}/reservations`}
            className="text-[length:var(--text-sm)] font-[var(--weight-medium)] text-primary transition-colors hover:text-primary-dark"
          >
            すべての予約を見る
          </Link>
        </div>

        {todayReservations.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-3xl)] text-center">
            <p className="text-[length:var(--text-base)] text-neutral-500">
              本日の予約はありません
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                    時間
                  </th>
                  <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                    顧客名
                  </th>
                  <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                    メニュー
                  </th>
                  <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                    担当
                  </th>
                  <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
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
                    <td className="whitespace-nowrap px-[var(--space-lg)] py-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-800">
                      {reservation.startTime}
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-lg)] py-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-800">
                      {reservation.customerName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-lg)] py-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-800">
                      {reservation.menuName}
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-lg)] py-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-800">
                      {reservation.staffName ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-lg)] py-[var(--space-md)]">
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
