import { StatusBadge } from "@/components/ui/StatusBadge";

type Reservation = {
  id: string;
  tenantName: string;
  menuName: string;
  date: string;
  status: string;
};

type ReservationHistoryProps = {
  totalCount: number;
  recentReservations: Reservation[];
};

export function ReservationHistory({
  totalCount,
  recentReservations,
}: ReservationHistoryProps) {
  return (
    <>
      <div className="mb-4 px-6">
        <span className="font-heading text-xl font-semibold tracking-tight text-neutral-900">
          {totalCount}
        </span>
        <span className="ml-1 text-sm text-neutral-500">総予約数</span>
      </div>
      <div className="px-6 pb-6">
        {recentReservations.length === 0 ? (
          <p className="text-sm text-neutral-500">予約履歴がありません</p>
        ) : (
          recentReservations.map((reservation, index) => (
            <div
              key={reservation.id}
              className={`grid grid-cols-[120px_1fr_1fr_100px] items-center gap-4 py-4 ${
                index < recentReservations.length - 1
                  ? "border-b border-neutral-200"
                  : ""
              }`}
            >
              <div className="text-sm font-medium text-neutral-800">
                {reservation.date}
              </div>
              <div className="text-sm text-neutral-700">
                {reservation.tenantName}
              </div>
              <div className="text-sm text-neutral-600">
                {reservation.menuName}
              </div>
              <StatusBadge status={reservation.status} variant="reservation" />
            </div>
          ))
        )}
      </div>
    </>
  );
}
