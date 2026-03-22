import { Link } from "react-router";
import { Card, CardBody } from "@/components/ui/Card";
import type { Route } from "./+types/dashboard";

export async function loader(_args: Route.LoaderArgs) {
  // TODO: プラットフォームサマリー取得
  // listTenants / listCustomers ユースケースから集計
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
      <h1 className="text-2xl font-bold text-text">ダッシュボード</h1>

      {/* サマリー */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-xs font-medium text-text-secondary">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-text">
                {stat.value.toLocaleString()}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 導線 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/platform/tenants">
          <Card className="transition-colors hover:bg-surface-secondary">
            <CardBody>
              <p className="text-sm font-semibold text-text">テナント管理</p>
              <p className="mt-1 text-xs text-text-secondary">
                テナントの一覧・詳細の確認、停止・再開・削除操作
              </p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/platform/users">
          <Card className="transition-colors hover:bg-surface-secondary">
            <CardBody>
              <p className="text-sm font-semibold text-text">ユーザー管理</p>
              <p className="mt-1 text-xs text-text-secondary">
                ユーザーの一覧・詳細の確認、停止・再開・削除操作
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}
