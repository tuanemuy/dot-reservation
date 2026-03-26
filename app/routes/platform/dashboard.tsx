import { data, Link } from "react-router";
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
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight">
          ダッシュボード
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          プラットフォーム全体の概要
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-neutral-300 rounded-lg p-6 transition-[border-color,box-shadow] duration-150 hover:!border-neutral-400 hover:shadow-sm"
          >
            <div className="text-sm text-neutral-500 font-normal mb-2">
              {stat.label}
            </div>
            <div className="font-heading text-3xl font-semibold tracking-tight leading-tight text-neutral-900">
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-neutral-300 rounded-lg mb-8">
        <div className="flex items-center justify-between p-6 pb-0 mb-4">
          <h2 className="font-heading text-lg font-semibold text-neutral-800 tracking-tight">
            クイックリンク
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
          <QuickLinkCard
            to="/platform/tenants"
            title="テナント管理"
            description="テナントの一覧・詳細・ステータス管理"
            icon={
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z"
                />
              </svg>
            }
          />
          <QuickLinkCard
            to="/platform/users"
            title="ユーザー管理"
            description="ユーザーの一覧・詳細・アカウント管理"
            icon={
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-6 bg-neutral-50 border border-neutral-300 rounded-md text-neutral-800 no-underline transition-[border-color,box-shadow] duration-150 hover:border-primary-light hover:shadow-sm"
    >
      <div className="flex shrink-0 items-center justify-center size-10 rounded-md bg-primary-lighter text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-base font-medium text-neutral-800 mb-[2px]">
          {title}
        </div>
        <div className="text-xs text-neutral-500">{description}</div>
      </div>
      <div className="text-neutral-500">
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="size-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </Link>
  );
}
