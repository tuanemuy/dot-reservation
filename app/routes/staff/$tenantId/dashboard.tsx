import { Link, useParams } from "react-router";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ReservationSummary } from "@/core/application/reservation/listReservations";
import { listReservations } from "@/core/application/reservation/listReservations";
import type { ShiftDetail } from "@/core/application/shift/listShifts";
import { listShifts } from "@/core/application/shift/listShifts";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/dashboard";

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTodayLabel(): string {
  const now = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${dayNames[now.getDay()]}）`;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;
  const today = formatToday();

  const todayShiftsResult = await handleUseCase(() =>
    listShifts({
      container,
      headers: request.headers,
      input: {
        tenantId,
        startDate: today,
        endDate: today,
        staffProfileId: null,
      },
    }),
  ).match(
    (result) => result.items,
    () => [] as ShiftDetail[],
  );

  const todayReservationsResult = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        tenantId,
        status: null,
        startDate: today,
        endDate: today,
        page: 1,
        limit: 50,
      },
    }),
  ).match(
    (result) => result.items,
    () => [] as ReservationSummary[],
  );

  const todayShift =
    todayShiftsResult.length > 0
      ? {
          startTime: todayShiftsResult[0].startTime,
          endTime: todayShiftsResult[0].endTime,
        }
      : null;

  return {
    todayReservations: todayReservationsResult,
    todayShift,
  };
}

export default function StaffDashboardPage({
  loaderData,
}: Route.ComponentProps) {
  const { todayReservations, todayShift } = loaderData;
  const { tenantId } = useParams();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-text-muted">{formatTodayLabel()}</p>
      </div>

      {/* Today's Timeline */}
      <div className="mb-8 rounded-[14px] border border-border bg-white">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-text">
            本日のタイムライン
          </h2>
          {todayShift && (
            <span className="text-sm text-text-muted">
              シフト: {todayShift.startTime} - {todayShift.endTime}
            </span>
          )}
        </div>
        <div className="px-6 pb-6 pt-4">
          {!todayShift ? (
            <p className="py-8 text-center text-sm text-text-muted">
              今日のシフトはありません
            </p>
          ) : todayReservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              今日の予約はありません
            </p>
          ) : (
            <div className="space-y-0">
              {todayReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid grid-cols-[50px_1fr] border-t border-surface-secondary"
                >
                  <div className="pr-4 pt-1 text-right font-heading text-xs font-medium text-text-muted">
                    {reservation.startTime}
                  </div>
                  <div className="min-h-[60px] border-t border-surface-secondary py-2">
                    <Link
                      to={`/staff/${tenantId}/reservations/${reservation.id}`}
                      className="block rounded-[10px] border border-border bg-white px-4 py-2 no-underline transition-shadow duration-150 hover:shadow-sm"
                    >
                      <span className="text-xs font-medium text-text-muted">
                        {reservation.startTime} - {reservation.endTime}
                      </span>
                      <p className="mt-0.5 text-sm font-medium text-text">
                        {reservation.customerName ?? "顧客"}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {reservation.menuName}
                      </p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Reservations List */}
      <div className="rounded-[14px] border border-border bg-white">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-text">
            今日の予約
          </h2>
          <Link
            to={`/staff/${tenantId}/reservations`}
            className="text-sm font-medium text-primary no-underline transition-colors duration-150 hover:text-primary-dark"
          >
            すべて見る
          </Link>
        </div>
        <div className="px-6 pb-6">
          {todayReservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              今日の予約はありません
            </p>
          ) : (
            <div>
              {todayReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid grid-cols-[80px_1fr_180px_100px] items-center gap-4 border-b border-surface-secondary py-4 last:border-b-0"
                >
                  <span className="font-heading text-base font-semibold tracking-tight text-text">
                    {reservation.startTime}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light text-xs font-medium text-secondary">
                      {(reservation.customerName ?? "?").charAt(0)}
                    </span>
                    <span className="text-base font-medium text-text">
                      {reservation.customerName ?? "顧客"}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {reservation.menuName}
                  </span>
                  <StatusBadge
                    status={reservation.status}
                    variant="reservation"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
