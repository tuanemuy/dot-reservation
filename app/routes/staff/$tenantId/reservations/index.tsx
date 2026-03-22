import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

type ViewMode = "list" | "calendar";

// TODO: 認証チェック
export async function loader({ params, request }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;
  const url = new URL(request.url);
  const _status = url.searchParams.get("status");
  const _page = url.searchParams.get("page") ?? "1";

  // TODO: 予約一覧取得
  return {
    reservations: [] as {
      id: string;
      customerName: string;
      menuName: string;
      dateTime: string;
      status: string;
    }[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
    },
  };
}

export default function StaffReservationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservations, pagination } = loaderData;
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">予約管理</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-l-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`rounded-r-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              }`}
            >
              カレンダー
            </button>
          </div>
          <Link
            to="new"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            代理予約登録
          </Link>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-3">
        <select className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none">
          <option value="">すべてのステータス</option>
          <option value="confirmed">確定</option>
          <option value="pending">承認待ち</option>
          <option value="cancelled">キャンセル</option>
        </select>
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
        />
      </div>

      {viewMode === "list" ? (
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          {reservations.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              予約がありません
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    顧客名
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    メニュー
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">日時</th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    ステータス
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {r.customerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.menuName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.dateTime}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={r.id}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <Link
                  key={`page-${i + 1}`}
                  to={`?page=${i + 1}`}
                  className={`rounded-md px-3 py-1 text-sm ${
                    pagination.currentPage === i + 1
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
          {/* TODO: カレンダービュー */}
          <div className="flex min-h-96 items-center justify-center text-sm text-gray-500">
            週表示カレンダー（自分の予約のみ）
          </div>
        </div>
      )}
    </div>
  );
}
