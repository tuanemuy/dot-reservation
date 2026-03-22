import { data, Link } from "react-router";
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

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "確定", className: "bg-green-100 text-green-800" },
  cancelled: { text: "キャンセル", className: "bg-red-100 text-red-800" },
  completed: { text: "完了", className: "bg-gray-100 text-gray-800" },
  rejected: { text: "却下", className: "bg-red-100 text-red-800" },
};

export default function TenantDashboardPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { todayReservations, pendingCount } = loaderData;
  const tenantId = params.tenantId;

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">ダッシュボード</h1>

      {/* 通知バナー */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800">
              承認待ちの予約が {pendingCount} 件あります
            </p>
            <Link
              to={`/admin/${tenantId}/reservations?status=pending`}
              className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
            >
              確認する
            </Link>
          </div>
        </div>
      )}

      {/* 当日の予約サマリー */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">本日の予約</h2>
          <Link
            to={`/admin/${tenantId}/reservations`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            すべての予約を見る
          </Link>
        </div>

        {todayReservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">本日の予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    担当
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todayReservations.map((reservation) => {
                  const status = statusLabels[reservation.status] ?? {
                    text: reservation.status,
                    className: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.startTime}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.customerName ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.menuName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.staffName ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
