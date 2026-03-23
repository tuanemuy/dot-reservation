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
  pending: { text: "承認待ち", className: "bg-warning/10 text-warning" },
  confirmed: { text: "確定", className: "bg-success/10 text-success" },
  cancelled: {
    text: "キャンセル",
    className: "bg-destructive/10 text-destructive",
  },
  completed: { text: "完了", className: "bg-neutral-200 text-neutral-800" },
  rejected: { text: "却下", className: "bg-destructive/10 text-destructive" },
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
    <div className="">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">予約管理</h1>
        <Link
          to={`/admin/${tenantId}/reservations/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          代理予約を登録
        </Link>
      </div>

      {/* 承認待ちバナー */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-warning/20 bg-warning/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-warning">
              承認待ちの予約が {pendingCount} 件あります
            </p>
            <button
              type="button"
              onClick={() => {
                searchParams.set("status", "pending");
                setSearchParams(searchParams);
              }}
              className="text-sm font-medium text-warning underline hover:text-warning"
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
          <div className="flex rounded-md border border-neutral-300">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-text text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-200"
              } rounded-l-md`}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-text text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-200"
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
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600"
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
          <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-12 text-center">
            <p className="text-neutral-500">予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    担当スタッフ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    予約日時
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((reservation) => {
                  const status = statusLabels[reservation.status] ?? {
                    text: reservation.status,
                    className: "bg-neutral-200 text-neutral-800",
                  };
                  return (
                    <tr key={reservation.id} className="hover:bg-neutral-200">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-800">
                        <Link
                          to={`/admin/${tenantId}/reservations/${reservation.id}`}
                          className="hover:text-primary"
                        >
                          {reservation.customerName ?? "-"}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                        {reservation.menuName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                        {reservation.staffName ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
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
        <div className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-8">
          <div className="flex min-h-96 items-center justify-center text-neutral-500">
            <p>週表示の予約カレンダーがここに表示されます</p>
          </div>
        </div>
      )}
    </div>
  );
}
