import { useCallback } from "react";
import {
  data,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  addDays,
  formatDateISO,
  getMonday,
  WeekCalendar,
} from "@/components/reservation/WeekCalendar";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listReservations } from "@/core/application/reservation/listReservations";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type ViewMode = "list" | "calendar";

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseWeekStart(param: string | null): Date {
  if (param) {
    const [year, month, day] = param.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  return getMonday(new Date());
}

const ITEMS_PER_PAGE = 20;

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const viewMode = url.searchParams.get("view") ?? "list";
  const weekStartParam = url.searchParams.get("weekStart");
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

  let startDate: string | null;
  let endDate: string | null;
  let limit: number;

  if (viewMode === "calendar") {
    const weekStart = parseWeekStart(weekStartParam);
    const weekEnd = addDays(weekStart, 6);
    startDate = formatDateISO(weekStart);
    endDate = formatDateISO(weekEnd);
    limit = 200;
  } else {
    startDate = url.searchParams.get("startDate") ?? formatToday();
    endDate = url.searchParams.get("endDate") ?? null;
    limit = ITEMS_PER_PAGE;
  }

  const result = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: status || null,
        startDate,
        endDate,
        page,
        limit,
      },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    reservations: result.items,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(result.totalCount / ITEMS_PER_PAGE)),
    },
  };
}

export default function StaffReservationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservations, pagination } = loaderData;
  const { tenantId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const viewMode: ViewMode =
    (searchParams.get("view") as ViewMode) === "calendar" ? "calendar" : "list";

  const currentStatus = searchParams.get("status") ?? "";

  const weekStart = parseWeekStart(searchParams.get("weekStart"));

  function handleStatusChange(newStatus: string) {
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.delete("page");
    setSearchParams(params);
  }

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
      params.delete("page");
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
      `/staff/${tenantId}/reservations/${reservationId}`,
    [tenantId],
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          予約管理
        </h1>
        <Link
          to={`/staff/${tenantId}/reservations/new`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-6 text-sm font-medium tracking-wide text-white no-underline transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99]"
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          代理予約登録
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        {/* 表示切替 */}
        <div className="flex overflow-hidden rounded-[10px] border border-border">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              viewMode === "list"
                ? "bg-text text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            リスト
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              viewMode === "calendar"
                ? "bg-text text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            カレンダー
          </button>
        </div>

        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-11 appearance-none rounded-[10px] border border-border bg-white px-4 pr-10 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%238E8B87'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "14px",
          }}
        >
          <option value="">すべてのステータス</option>
          <option value="confirmed">確定</option>
          <option value="pending">承認待ち</option>
          <option value="cancelled">キャンセル</option>
          <option value="completed">完了</option>
        </select>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Reservation Table */}
          <div className="mb-6 overflow-hidden rounded-[14px] border border-border bg-white">
            {reservations.length === 0 ? (
              <p className="py-12 text-center text-sm text-text-muted">
                予約がありません
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary">
                      予約日時
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary">
                      顧客名
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary">
                      メニュー名
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-text-secondary">
                      ステータス
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-surface-secondary last:border-b-0 hover:bg-surface/50"
                    >
                      <td className="px-6 py-4 font-medium text-text">
                        {r.date} {r.startTime}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light text-xs font-medium text-secondary">
                            {(r.customerName ?? "?").charAt(0)}
                          </span>
                          <span className="font-medium text-text">
                            {r.customerName ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {r.menuName}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} variant="reservation" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/staff/${tenantId}/reservations/${r.id}`}
                          className="text-sm font-medium text-primary no-underline transition-colors duration-150 hover:text-primary-dark"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {reservations.length > 0 && (
              <div className="border-t border-surface-secondary px-6 py-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  baseUrl=""
                  searchParams={searchParams}
                />
              </div>
            )}
          </div>
        </>
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
