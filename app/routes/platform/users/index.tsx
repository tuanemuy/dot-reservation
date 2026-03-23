import { data, Form, Link, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { listCustomers } from "@/core/application/customer/listCustomers";
import { container } from "@/core/di/server";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
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
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 20;

  const result = await handleUseCase(() =>
    listCustomers({
      container,
      headers: request.headers,
      input: { keyword, status, page, limit },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const users: UserSummary[] = result.items.map((item) => ({
    id: item.id,
    name: item.displayName,
    email: item.email,
    status: item.status,
    createdAt: item.createdAt.toLocaleDateString("ja-JP"),
    lastLoginAt: null,
  }));

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(result.totalCount / limit)),
    },
  };
}

export default function PlatformUsersPage({
  loaderData,
}: Route.ComponentProps) {
  const { users, pagination } = loaderData;
  const [searchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">ユーザー管理</h1>

      {/* フィルター */}
      <Form method="get" className="flex flex-wrap gap-3">
        <Input
          type="text"
          name="keyword"
          placeholder="名前・メールアドレスで検索"
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
        <Button type="submit">検索</Button>
      </Form>

      {/* ユーザー一覧 */}
      <Card>
        {users.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            ユーザーが見つかりません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    ユーザー名
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    メールアドレス
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    ステータス
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    登録日
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">
                    最終ログイン
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-secondary">
                    <td className="px-4 py-3 font-medium text-text">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={statusBadgeVariant[user.status] ?? "default"}
                      >
                        {statusLabels[user.status] ?? user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.createdAt}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {user.lastLoginAt ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={user.id}
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
        baseUrl="/platform/users"
        searchParams={searchParams}
      />
    </div>
  );
}
