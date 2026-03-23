import { data, Form, Link, useSearchParams } from "react-router";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listTenants } from "@/core/application/tenant/listTenants";
import { container } from "@/core/di/server";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type TenantSummary = {
  id: string;
  name: string;
  category: string;
  status: string;
  memberCount: number;
  createdAt: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || null;
  const status = url.searchParams.get("status") || null;
  const category = url.searchParams.get("category") || null;
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 20;

  const result = await handleUseCase(() =>
    listTenants({
      container,
      headers: request.headers,
      input: { keyword, status, category, page, limit },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const memberCounts = await Promise.all(
    result.items.map(async (item) => {
      const tenantId = TenantId.create(item.id);
      const members = await container.memberRepository.findByTenantId(
        tenantId,
        { page: 1, limit: 1 },
      );
      return { id: item.id, count: members.total };
    }),
  );
  const memberCountMap = new Map(memberCounts.map((mc) => [mc.id, mc.count]));

  const tenants: TenantSummary[] = result.items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    status: item.status,
    memberCount: memberCountMap.get(item.id) ?? 0,
    createdAt: item.createdAt,
  }));

  return {
    tenants,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(result.totalCount / limit)),
    },
  };
}

export default function PlatformTenantsPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenants, pagination } = loaderData;
  const [searchParams] = useSearchParams();

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
          テナント管理
        </h1>
      </div>

      {/* Filters */}
      <Form
        method="get"
        className="flex items-center"
        style={{ gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}
      >
        <div className="relative flex-1" style={{ maxWidth: "400px" }}>
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute"
            style={{
              left: "var(--space-md)",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "var(--color-neutral-500)",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            name="keyword"
            placeholder="テナント名で検索"
            defaultValue={searchParams.get("keyword") ?? ""}
            className="w-full focus:outline-none"
            style={{
              height: "44px",
              padding: "0 var(--space-md) 0 calc(var(--space-md) + 24px)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 400,
              color: "var(--color-neutral-900)",
              background: "var(--color-bg-page)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: "var(--radius-md)",
              transition: "border-color var(--transition-default)",
            }}
          />
        </div>
        <select
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          className="cursor-pointer appearance-none focus:outline-none"
          style={{
            height: "44px",
            padding: "0 var(--space-xl) 0 var(--space-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 400,
            color: "var(--color-neutral-700)",
            background: "var(--color-bg-page)",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: "var(--radius-md)",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8B5B1' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right var(--space-sm) center",
            backgroundSize: "16px",
            transition: "border-color var(--transition-default)",
          }}
        >
          <option value="">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="suspended">停止中</option>
        </select>
        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="cursor-pointer appearance-none focus:outline-none"
          style={{
            height: "44px",
            padding: "0 var(--space-xl) 0 var(--space-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: 400,
            color: "var(--color-neutral-700)",
            background: "var(--color-bg-page)",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: "var(--radius-md)",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B8B5B1' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right var(--space-sm) center",
            backgroundSize: "16px",
            transition: "border-color var(--transition-default)",
          }}
        >
          <option value="">すべてのカテゴリー</option>
          <option value="hair">美容室</option>
          <option value="nail">ネイルサロン</option>
          <option value="esthetic">エステサロン</option>
          <option value="relaxation">リラクゼーション</option>
          <option value="clinic">クリニック</option>
          <option value="fitness">フィットネス</option>
          <option value="other">その他</option>
        </select>
        <button type="submit" className="sr-only" aria-label="検索">
          検索
        </button>
      </Form>

      {/* Table */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-xl)",
          overflow: "hidden",
        }}
      >
        {tenants.length === 0 ? (
          <p
            className="text-center"
            style={{
              padding: "var(--space-xl)",
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-500)",
            }}
          >
            テナントが見つかりません
          </p>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "テナント名",
                  "カテゴリー",
                  "ステータス",
                  "メンバー数",
                  "登録日",
                ].map((header) => (
                  <th
                    key={header}
                    className="text-left"
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-neutral-500)",
                      letterSpacing: "var(--tracking-wide)",
                      borderBottom: "1px solid var(--color-neutral-300)",
                      background: "var(--color-neutral-50)",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr key={tenant.id} className="hover-table-row">
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < tenants.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <Link
                      to={tenant.id}
                      className="no-underline"
                      style={{
                        fontWeight: 500,
                        color: "var(--color-primary)",
                        transition: "color var(--transition-default)",
                      }}
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < tenants.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <span
                      className="inline-flex items-center"
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        background: "var(--color-primary-lighter)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {tenant.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      borderBottom:
                        index < tenants.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <StatusBadge status={tenant.status} variant="tenant" />
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < tenants.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {tenant.memberCount}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < tenants.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {tenant.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.totalPages > 1 && (
          <div
            style={{
              borderTop: "1px solid var(--color-neutral-200)",
              padding: "var(--space-md)",
            }}
          >
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              baseUrl="/platform/tenants"
              searchParams={searchParams}
            />
          </div>
        )}
      </div>
    </div>
  );
}
