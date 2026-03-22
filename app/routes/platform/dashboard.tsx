import { Link } from "react-router";
import type { Route } from "./+types/dashboard";

// TODO: 認証チェック
export async function loader(_args: Route.LoaderArgs) {
  // TODO: プラットフォームサマリー取得
  return {
    summary: {
      totalTenants: 0,
      activeTenants: 0,
      totalUsers: 0,
      activeUsers: 0,
    },
  };
}

export default function PlatformDashboardPage({
  loaderData,
}: Route.ComponentProps) {
  const { summary } = loaderData;

  const stats = [
    { label: "テナント総数", value: summary.totalTenants },
    { label: "アクティブテナント", value: summary.activeTenants },
    { label: "ユーザー総数", value: summary.totalUsers },
    { label: "アクティブユーザー", value: summary.activeUsers },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>

      {/* サマリー */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200"
          >
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 導線 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/platform/tenants"
          className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
        >
          <p className="text-sm font-semibold text-gray-900">テナント管理</p>
          <p className="mt-1 text-xs text-gray-500">
            テナントの一覧・詳細の確認、停止・再開・削除操作
          </p>
        </Link>
        <Link
          to="/platform/users"
          className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
        >
          <p className="text-sm font-semibold text-gray-900">ユーザー管理</p>
          <p className="mt-1 text-xs text-gray-500">
            ユーザーの一覧・詳細の確認、停止・再開・削除操作
          </p>
        </Link>
      </div>
    </div>
  );
}
