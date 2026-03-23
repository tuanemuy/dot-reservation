import { useCallback } from "react";
import { data, Link, useNavigate, useSearchParams } from "react-router";
import {
  addDays,
  formatDateISO,
  getMonday,
  WeekCalendar,
} from "@/components/reservation/WeekCalendar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listReservations } from "@/core/application/reservation/listReservations";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type ViewMode = "list" | "calendar";

function parseWeekStart(param: string | null): Date {
  if (param) {
    const [year, month, day] = param.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  return getMonday(new Date());
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const viewMode = url.searchParams.get("view") ?? "list";
  const weekStartParam = url.searchParams.get("weekStart");

  let startDate: string | null = null;
  let endDate: string | null = null;
  let limit = 50;

  if (viewMode === "calendar") {
    const weekStart = parseWeekStart(weekStartParam);
    const weekEnd = addDays(weekStart, 6);
    startDate = formatDateISO(weekStart);
    endDate = formatDateISO(weekEnd);
    limit = 200;
  }

  const reservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: statusFilter,
        startDate,
        endDate,
        page: 1,
        limit,
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

export default function TenantReservationsPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { reservations, pendingCount } = loaderData;
  const tenantId = params.tenantId;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const viewMode: ViewMode =
    (searchParams.get("view") as ViewMode) === "calendar" ? "calendar" : "list";

  const statusFilter = searchParams.get("status") || "all";

  const weekStart = parseWeekStart(searchParams.get("weekStart"));

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams);
      if (mode === "calendar") {
        params.set("view", "calendar");
        if (!params.has("weekStart")) {
          params.set("weekStart", formatDateISO(getMonday(new Date())));
        }
      } else {
        params.delete("view");
        params.delete("weekStart");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleWeekChange = useCallback(
    (newWeekStart: Date) => {
      const params = new URLSearchParams(searchParams);
      params.set("weekStart", formatDateISO(newWeekStart));
      params.set("view", "calendar");
      navigate(`?${params.toString()}`, { preventScrollReset: true });
    },
    [searchParams, navigate],
  );

  const buildDetailPath = useCallback(
    (reservationId: string) =>
      `/admin/${tenantId}/reservations/${reservationId}`,
    [tenantId],
  );

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
                const params = new URLSearchParams(searchParams);
                params.set("status", "pending");
                setSearchParams(params);
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
              const params = new URLSearchParams(searchParams);
              if (e.target.value === "all") {
                params.delete("status");
              } else {
                params.set("status", e.target.value);
              }
              setSearchParams(params);
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
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-neutral-200">
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge
                        status={reservation.status}
                        variant="reservation"
                      />
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
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* カレンダー表示 */
        <WeekCalendar
          reservations={reservations}
          weekStart={weekStart}
          onWeekChange={handleWeekChange}
          buildDetailPath={buildDetailPath}
        />
      )}
    </div>
  );
}
