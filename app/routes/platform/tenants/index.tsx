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
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight">
          テナント管理
        </h1>
      </div>

      {/* Filters */}
      <Form method="get" className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-[400px]">
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500"
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
            className="w-full h-[44px] pl-[calc(1rem+24px)] pr-4 font-body text-sm font-normal text-neutral-900 bg-white border border-neutral-300 rounded-md duration-150 focus:outline-none"
          />
        </div>
        <select
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          className="h-[44px] pl-4 pr-8 font-body text-sm font-normal text-neutral-700 bg-white border border-neutral-300 rounded-md cursor-pointer appearance-none duration-150 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2024%2024%27%20stroke=%27%23B8B5B1%27%20stroke-width=%272%27%3E%3Cpath%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20d=%27M19.5%208.25l-7.5%207.5-7.5-7.5%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:16px] focus:outline-none"
        >
          <option value="">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="suspended">停止中</option>
        </select>
        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="h-[44px] pl-4 pr-8 font-body text-sm font-normal text-neutral-700 bg-white border border-neutral-300 rounded-md cursor-pointer appearance-none duration-150 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2024%2024%27%20stroke=%27%23B8B5B1%27%20stroke-width=%272%27%3E%3Cpath%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20d=%27M19.5%208.25l-7.5%207.5-7.5-7.5%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:16px] focus:outline-none"
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
      <div className="bg-white border border-neutral-300 rounded-lg mb-8 overflow-hidden">
        {tenants.length === 0 ? (
          <p className="text-center p-8 text-sm text-neutral-500">
            テナントが見つかりません
          </p>
        ) : (
          <table className="w-full border-collapse">
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
                    className="text-left py-4 px-6 text-xs font-medium text-neutral-500 tracking-wide border-b border-neutral-300 bg-neutral-50"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, index) => (
                <tr
                  key={tenant.id}
                  className="transition-colors duration-150 hover:bg-neutral-50"
                >
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < tenants.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <Link
                      to={tenant.id}
                      className="font-medium text-primary duration-150 no-underline"
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < tenants.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <span className="inline-flex items-center px-[10px] py-[3px] rounded-full text-xs font-medium bg-primary-lighter text-primary">
                      {tenant.category}
                    </span>
                  </td>
                  <td
                    className={`py-4 px-6 text-sm ${index < tenants.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <StatusBadge status={tenant.status} variant="tenant" />
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < tenants.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    {tenant.memberCount}
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < tenants.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    {tenant.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.totalPages > 1 && (
          <div className="border-t border-neutral-200 p-4">
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
