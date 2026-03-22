import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

// TODO: loader で予約一覧を取得

type ViewMode = "list" | "calendar";

// 仮データ
const mockReservations = [
  {
    id: "1",
    customerName: "山田 太郎",
    menuName: "カット",
    staffName: "佐藤 花子",
    dateTime: "2024-01-15 10:00",
    status: "pending",
  },
  {
    id: "2",
    customerName: "鈴木 一郎",
    menuName: "カラー",
    staffName: "田中 次郎",
    dateTime: "2024-01-15 13:00",
    status: "confirmed",
  },
  {
    id: "3",
    customerName: "高橋 美咲",
    menuName: "パーマ",
    staffName: "佐藤 花子",
    dateTime: "2024-01-16 15:30",
    status: "confirmed",
  },
  {
    id: "4",
    customerName: "渡辺 健太",
    menuName: "カット＋カラー",
    staffName: "田中 次郎",
    dateTime: "2024-01-17 11:00",
    status: "cancelled",
  },
];

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "確定", className: "bg-green-100 text-green-800" },
  cancelled: { text: "キャンセル", className: "bg-red-100 text-red-800" },
  completed: { text: "完了", className: "bg-gray-100 text-gray-800" },
  rejected: { text: "却下", className: "bg-red-100 text-red-800" },
};

const mockPendingCount = 1;

export default function TenantReservationsPage() {
  const { tenantId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const statusFilter = searchParams.get("status") || "all";

  const filteredReservations =
    statusFilter === "all"
      ? mockReservations
      : mockReservations.filter((r) => r.status === statusFilter);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
        <Link
          to={`/admin/${tenantId}/reservations/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          代理予約を登録
        </Link>
      </div>

      {/* 承認待ちバナー */}
      {mockPendingCount > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800">
              承認待ちの予約が {mockPendingCount} 件あります
            </p>
            <button
              type="button"
              onClick={() => {
                searchParams.set("status", "pending");
                setSearchParams(searchParams);
              }}
              className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
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
          <div className="flex rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } rounded-l-md`}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
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
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
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
        filteredReservations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">予約はありません</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    メニュー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    担当スタッフ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    予約日時
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const status = statusLabels[reservation.status] ?? {
                    text: reservation.status,
                    className: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        <Link
                          to={`/admin/${tenantId}/reservations/${reservation.id}`}
                          className="hover:text-blue-600"
                        >
                          {reservation.customerName}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.menuName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.staffName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {reservation.dateTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* カレンダー表示（プレースホルダー） */
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex min-h-96 items-center justify-center text-gray-400">
            <p>週表示の予約カレンダーがここに表示されます</p>
            {/* TODO: 予約カレンダーコンポーネントを実装 */}
          </div>
        </div>
      )}
    </div>
  );
}
