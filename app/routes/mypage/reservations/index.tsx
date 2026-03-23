import { data, Link, redirect, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { listReservations } from "@/core/application/reservation/listReservations";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const ITEMS_PER_PAGE = 10;

const statusLabels: Record<string, string> = {
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

const statusBadgeVariants: Record<string, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  rejected: "destructive",
};

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "upcoming";
  const page = Number(url.searchParams.get("page") ?? "1");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/customer/login");
  }
  const customer = await container.customerRepository.findByAuthUserId(
    session.user.id,
  );
  if (!customer) {
    throw redirect("/customer/setup");
  }
  const customerId = customer.id;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const result = await handleUseCase(() =>
    listReservations({
      container,
      headers: request.headers,
      input: {
        customerId,
        status: null,
        startDate: tab === "upcoming" ? todayStr : null,
        endDate: tab === "past" ? todayStr : null,
        page,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    reservations: result.items,
    tab,
    page,
    totalPages: Math.ceil(result.totalCount / ITEMS_PER_PAGE),
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
                          variant={
                            statusBadgeVariants[reservation.status] ?? "default"
                          }
                        >
                          {statusLabels[reservation.status] ??
                            reservation.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-text">
                        {reservation.menuName}
                      </p>
                      {reservation.staffName && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {reservation.staffName}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right text-sm text-text-secondary">
                      <p>
                        {new Date(reservation.date).toLocaleDateString("ja-JP")}
                      </p>
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
