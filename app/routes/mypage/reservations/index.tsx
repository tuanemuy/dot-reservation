import { Link, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import type { Route } from "./+types/index";

// TODO: 実際のユースケースからデータを取得する
type ReservationSummary = {
  id: string;
  storeName: string;
  menuName: string;
  staffName: string | null;
  date: string;
  startTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
};

const statusLabels: Record<ReservationSummary["status"], string> = {
  pending: "承認待ち",
  confirmed: "確定",
  completed: "完了",
  cancelled: "キャンセル",
  rejected: "却下",
};

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

const statusBadgeVariants: Record<ReservationSummary["status"], BadgeVariant> =
  {
    pending: "warning",
    confirmed: "success",
    completed: "default",
    cancelled: "destructive",
    rejected: "destructive",
  };

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "upcoming";
  const page = Number(url.searchParams.get("page") ?? "1");

  // TODO: 認証ユーザーのIDを取得して予約一覧を取得
  // const customerId = "dummy-customer-id";

  const dummyReservations: ReservationSummary[] = [
    {
      id: "1",
      storeName: "サンプル美容室",
      menuName: "カット",
      staffName: "田中 花子",
      date: "2026-03-25",
      startTime: "10:00",
      status: "confirmed",
    },
    {
      id: "2",
      storeName: "サンプル美容室",
      menuName: "カラー",
      staffName: null,
      date: "2026-03-28",
      startTime: "14:00",
      status: "pending",
    },
  ];

  return {
    reservations: dummyReservations,
    tab,
    page,
    totalPages: 1,
  };
}

export default function ReservationsIndexPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservations, tab, page, totalPages } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", newTab);
    params.delete("page");
    setSearchParams(params);
  };

  const tabs = [
    { id: "upcoming", label: "今後の予約" },
    { id: "past", label: "過去の予約" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">予約一覧</h1>

      <Tabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange}>
        {reservations.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-muted">
            予約はありません
          </p>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <Link
                key={reservation.id}
                to={`/mypage/reservations/${reservation.id}`}
                className="block"
              >
                <Card className="p-4 transition-colors hover:bg-surface-secondary">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge
                          variant={statusBadgeVariants[reservation.status]}
                        >
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>
                      <p className="font-medium text-text">
                        {reservation.storeName}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {reservation.menuName}
                        {reservation.staffName && ` / ${reservation.staffName}`}
                      </p>
                    </div>
                    <div className="ml-4 text-right text-sm text-text-secondary">
                      <p>{reservation.date}</p>
                      <p>{reservation.startTime}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Tabs>

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/mypage/reservations"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
