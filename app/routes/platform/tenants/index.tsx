import { Form, Link, useSearchParams } from "react-router";
import type { Route } from "./+types/index";

// TODO: 認証チェック
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const _keyword = url.searchParams.get("keyword") ?? "";
  const _status = url.searchParams.get("status") ?? "";
  const _category = url.searchParams.get("category") ?? "";
  const _page = url.searchParams.get("page") ?? "1";

  // TODO: テナント一覧取得
  return {
    tenants: [] as {
      id: string;
      name: string;
      category: string;
      status: string;
      memberCount: number;
      createdAt: string;
    }[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
    },
  };
}

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

export default function PlatformTenantsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenants, pagination } = loaderData;
  const [searchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">テナント管理</h1>

      {/* フィルター */}
      <Form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="keyword"
          placeholder="テナント名で検索"
          defaultValue={searchParams.get("keyword") ?? ""}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
        >
          <option value="">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="suspended">停止中</option>
        </select>
        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
        >
          <option value="">すべてのカテゴリー</option>
          {/* TODO: カテゴリー一覧 */}
        </select>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          検索
        </button>
      </Form>

      {/* テナント一覧 */}
      <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
        {tenants.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            テナントが見つかりません
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">
                  テナント名
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  カテゴリー
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  ステータス
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  メンバー数
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">登録日</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tenant.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tenant.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tenant.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {statusLabels[tenant.status] ?? tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tenant.memberCount}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tenant.createdAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={tenant.id}
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
    </div>
  );
}
