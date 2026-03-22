import { useState } from "react";
import { data, Link, useSearchParams } from "react-router";
import { listReservations } from "@/core/application/reservation/listReservations";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type ViewMode = "list" | "calendar";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");

  const reservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: statusFilter,
        startDate: null,
        endDate: null,
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

  const pendingResult = await handleUseCase(() =>
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
    reservations: reservationsResult.items,
    totalCount: reservationsResult.totalCount,
    pendingCount: pendingResult.totalCount,
  };
}

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "確定", className: "bg-green-100 text-green-800" },
  cancelled: { text: "キャンセル", className: "bg-red-100 text-red-800" },
  completed: { text: "完了", className: "bg-gray-100 text-gray-800" },
  rejected: { text: "却下", className: "bg-red-100 text-red-800" },
};

export default function TenantReservationsPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { reservations, pendingCount } = loaderData;
  const tenantId = params.tenantId;
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusFilter = searchParams.get("status") || "all";

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
        <Link
          to={`/admin/${tenantId}/reservations/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          代理予約を登録
        </Link>
      </div>

      {/* 承認待ちバナー */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800">
              承認待ちの予約が {pendingCount} 件あります
            </p>
            <button
              type="button"
              onClick={() => {
                searchParams.set("status", "pending");
                setSearchParams(searchParams);
              }}
              className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
            >
              表示する
            </button>
          </div>
        </div>
      )}

      {/* コントロール */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 表示切替 */}
          <div className="flex rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } rounded-l-md`}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } rounded-r-md`}
            >
              カレンダー
            </button>
          </div>

          {/* ステータスフィルター */}
          <select
            value={statusFilter}
            onChange={(e) => {
              if (e.target.value === "all") {
                searchParams.delete("status");
              } else {
                searchParams.set("status", e.target.value);
              }
              setSearchParams(searchParams);
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="all">すべてのステータス</option>
            <option value="pending">承認待ち</option>
            <option value="confirmed">確定</option>
            <option value="completed">完了</option>
            <option value="cancelled">キャンセル</option>
            <option value="rejected">却下</option>
          </select>
        </div>
      </div>

      {/* リスト表示 */}
      {viewMode === "list" ? (
        reservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    担当スタッフ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    予約日時
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => {
                  const status = statusLabels[reservation.status] ?? {
                    text: reservation.status,
                    className: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        <Link
                          to={`/admin/${tenantId}/reservations/${reservation.id}`}
                          className="hover:text-blue-600"
                        >
                          {reservation.customerName ?? "-"}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.menuName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.staffName ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.date} {reservation.startTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* カレンダー表示 */
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex min-h-96 items-center justify-center text-gray-400">
            <p>週表示の予約カレンダーがここに表示されます</p>
          </div>
        </div>
      )}
    </div>
  );
}
