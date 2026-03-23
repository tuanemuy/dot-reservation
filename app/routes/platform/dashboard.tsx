import { data, Link } from "react-router";
import { Card, CardBody } from "@/components/ui/Card";
import { listCustomers } from "@/core/application/customer/listCustomers";
import { listTenants } from "@/core/application/tenant/listTenants";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
  const tenantsResult = await handleUseCase(() =>
    listTenants({
      container,
      headers: request.headers,
      input: { keyword: null, status: null, category: null, page: 1, limit: 1 },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const activeTenantsResult = await handleUseCase(() =>
    listTenants({
      container,
      headers: request.headers,
      input: {
        keyword: null,
        status: "active",
        category: null,
        page: 1,
        limit: 1,
      },
    }),
  ).match(
    (result) => result,
    () => ({ items: [], totalCount: 0 }),
  );

  const customersResult = await handleUseCase(() =>
    listCustomers({
      container,
      headers: request.headers,
      input: { keyword: null, status: null, page: 1, limit: 1 },
    }),
  ).match(
    (result) => result,
    () => ({ items: [], totalCount: 0 }),
  );

  const activeCustomersResult = await handleUseCase(() =>
    listCustomers({
      container,
      headers: request.headers,
      input: { keyword: null, status: "active", page: 1, limit: 1 },
    }),
  ).match(
    (result) => result,
    () => ({ items: [], totalCount: 0 }),
  );

  return {
    summary: {
      totalTenants: tenantsResult.totalCount,
      activeTenants: activeTenantsResult.totalCount,
      totalUsers: customersResult.totalCount,
      activeUsers: activeCustomersResult.totalCount,
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
