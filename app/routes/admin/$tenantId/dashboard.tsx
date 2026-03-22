import { Link, useParams } from "react-router";

// TODO: loader でダッシュボードデータを取得

// 仮データ
const mockPendingReservations = 3;
const mockTodayReservations = [
  {
    id: "1",
    customerName: "山田 太郎",
    menuName: "カット",
    staffName: "佐藤 花子",
    time: "10:00",
    status: "confirmed",
  },
  {
    id: "2",
    customerName: "鈴木 一郎",
    menuName: "カラー",
    staffName: "田中 次郎",
    time: "13:00",
    status: "confirmed",
  },
  {
    id: "3",
    customerName: "高橋 美咲",
    menuName: "パーマ",
    staffName: "佐藤 花子",
    time: "15:30",
    status: "pending",
  },
];

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "確定", className: "bg-green-100 text-green-800" },
  cancelled: { text: "キャンセル", className: "bg-red-100 text-red-800" },
};

export default function TenantDashboardPage() {
  const { tenantId } = useParams();

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">ダッシュボード</h1>

      {/* 通知バナー */}
      {mockPendingReservations > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800">
              承認待ちの予約が {mockPendingReservations} 件あります
            </p>
            <Link
              to={`/admin/${tenantId}/reservations?status=pending`}
              className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
            >
              確認する
            </Link>
          </div>
        </div>
      )}

      {/* TODO: 初期セットアップガイド（テナント新規登録直後のみ） */}

      {/* 当日の予約サマリー */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">本日の予約</h2>
          <Link
            to={`/admin/${tenantId}/reservations`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            すべての予約を見る
          </Link>
        </div>

        {mockTodayReservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">本日の予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    担当
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTodayReservations.map((reservation) => {
                  const status = statusLabels[reservation.status] ?? {
                    text: reservation.status,
                    className: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.time}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.customerName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.menuName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {reservation.staffName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
