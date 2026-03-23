import { data, Form, Link, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
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

const statusBadgeVariant: Record<string, "success" | "destructive"> = {
  active: "success",
  suspended: "destructive",
};

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">テナント管理</h1>

      {/* フィルター */}
      <Form method="get" className="flex flex-wrap gap-3">
        <Input
          type="text"
          name="keyword"
          placeholder="テナント名で検索"
          defaultValue={searchParams.get("keyword") ?? ""}
          className="w-auto"
        />
        <Select
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          className="w-auto"
        >
          <option value="">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="suspended">停止中</option>
        </Select>
        <Select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="w-auto"
        >
          <option value="">すべてのカテゴリー</option>
          <option value="hair">美容室</option>
          <option value="nail">ネイルサロン</option>
          <option value="esthetic">エステサロン</option>
          <option value="clinic">クリニック</option>
          <option value="other">その他</option>
        </Select>
        <Button type="submit">検索</Button>
      </Form>

      {/* テナント一覧 */}
      <Card>
        {tenants.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            テナントが見つかりません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    テナント名
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    カテゴリー
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    ステータス
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    メンバー数
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    登録日
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-surface-secondary">
                    <td className="px-4 py-3 font-medium text-text">
                      {tenant.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {tenant.category}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusBadgeVariant[tenant.status] ?? "default"}
                      >
                        {statusLabels[tenant.status] ?? tenant.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {tenant.memberCount}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {tenant.createdAt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={tenant.id}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        baseUrl="/platform/tenants"
        searchParams={searchParams}
      />
    </div>
  );
}
