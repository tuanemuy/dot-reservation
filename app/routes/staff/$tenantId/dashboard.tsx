import type { Route } from "./+types/dashboard";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: スタッフのダッシュボードデータ取得
  return {
    todayReservations: [] as {
      id: string;
      customerName: string;
      menuName: string;
      startTime: string;
      endTime: string;
      status: string;
    }[],
    todayShift: null as { startTime: string; endTime: string } | null,
  };
}

export default function StaffDashboardPage({
  loaderData,
}: Route.ComponentProps) {
  const { todayReservations, todayShift } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>

      {/* 今日のシフト */}
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-base font-semibold text-gray-800">
          今日のシフト
        </h2>
        {todayShift ? (
          <p className="text-sm text-gray-600">
            {todayShift.startTime} - {todayShift.endTime}
          </p>
        ) : (
          <p className="text-sm text-gray-500">今日のシフトはありません</p>
        )}
      </section>

      {/* 今日の予約一覧 */}
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-base font-semibold text-gray-800">
          今日の予約
        </h2>
        {todayReservations.length === 0 ? (
          <p className="text-sm text-gray-500">今日の予約はありません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {todayReservations.map((reservation) => (
              <li key={reservation.id} className="flex items-center gap-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {reservation.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reservation.menuName}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  {reservation.startTime} - {reservation.endTime}
                </p>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {reservation.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
