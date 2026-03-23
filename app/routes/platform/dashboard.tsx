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
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            color: "var(--color-neutral-900)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          ダッシュボード
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-500)",
            marginTop: "var(--space-xs)",
          }}
        >
          プラットフォーム全体の概要
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="platform-stat-card"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-lg)",
              transition:
                "border-color var(--transition-default), box-shadow var(--transition-default)",
            }}
          >
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-neutral-500)",
                fontWeight: 400,
                marginBottom: "var(--space-sm)",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "var(--text-3xl)",
                fontWeight: 600,
                letterSpacing: "var(--tracking-tight)",
                lineHeight: "var(--leading-tight)",
                color: "var(--color-neutral-900)",
              }}
            >
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-xl)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "var(--space-lg) var(--space-lg) 0",
            marginBottom: "var(--space-md)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--color-neutral-800)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            クイックリンク
          </h2>
        </div>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "var(--space-md)",
            padding: "0 var(--space-lg) var(--space-lg)",
          }}
        >
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
                style={{ width: "20px", height: "20px" }}
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
                style={{ width: "20px", height: "20px" }}
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
      className="hover-card-highlight flex items-center no-underline"
      style={{
        gap: "var(--space-md)",
        padding: "var(--space-lg)",
        background: "var(--color-neutral-50)",
        border: "1px solid var(--color-neutral-300)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-neutral-800)",
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-primary-lighter)",
          color: "var(--color-primary)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 500,
            color: "var(--color-neutral-800)",
            marginBottom: "2px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-neutral-500)",
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ color: "var(--color-neutral-500)" }}>
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ width: "16px", height: "16px" }}
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
