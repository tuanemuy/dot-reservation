import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
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

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

const statusLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  cancelled: "キャンセル",
  completed: "完了",
  rejected: "却下",
};

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;
  const today = formatToday();

  // For staff dashboard, we need the staff profile ID.
  // In a real app, this would come from auth. For now, load shifts and reservations for the tenant.
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
  const _tenantId =
    typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">ダッシュボード</h1>

      {/* 今日のシフト */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-text">今日のシフト</h2>
        </CardHeader>
        <CardBody>
          {todayShift ? (
            <p className="text-sm text-text-secondary">
              {todayShift.startTime} - {todayShift.endTime}
            </p>
          ) : (
            <p className="text-sm text-text-muted">今日のシフトはありません</p>
          )}
        </CardBody>
      </Card>

      {/* 今日の予約一覧 */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">今日の予約</h2>
          <Link
            to="reservations"
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            すべて見る
          </Link>
        </CardHeader>
        <CardBody>
          {todayReservations.length === 0 ? (
            <p className="text-sm text-text-muted">今日の予約はありません</p>
          ) : (
            <ul className="divide-y divide-border">
              {todayReservations.map((reservation) => (
                <li
                  key={reservation.id}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">
                      {reservation.customerName ?? "顧客"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {reservation.menuName}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {reservation.startTime} - {reservation.endTime}
                  </p>
                  <Badge
                    variant={
                      statusBadgeVariants[reservation.status] ?? "default"
                    }
                  >
                    {statusLabels[reservation.status] ?? reservation.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
