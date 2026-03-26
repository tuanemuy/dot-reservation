import { data, Form, Link, useSearchParams } from "react-router";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

  const lastLoginDates = await Promise.all(
    result.items.map((item) =>
      container.authProvider.getLastLoginAt(item.authUserId),
    ),
  );

  const users: UserSummary[] = result.items.map((item, index) => {
    const lastLogin = lastLoginDates[index];
    return {
      id: item.id,
      name: item.displayName,
      email: item.email,
      status: item.status,
      createdAt: item.createdAt.toLocaleDateString("ja-JP"),
      lastLoginAt: lastLogin ? lastLogin.toLocaleDateString("ja-JP") : null,
    };
  });

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
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight">
          ユーザー管理
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
            placeholder="顧客名・メールアドレスで検索"
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
        <button type="submit" className="sr-only" aria-label="検索">
          検索
        </button>
      </Form>

      {/* Table */}
      <div className="bg-white border border-neutral-300 rounded-lg mb-8 overflow-hidden">
        {users.length === 0 ? (
          <p className="text-center p-8 text-sm text-neutral-500">
            ユーザーが見つかりません
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "顧客名",
                  "メールアドレス",
                  "ステータス",
                  "登録日",
                  "最終ログイン日",
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
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="transition-colors duration-150 hover:bg-neutral-50"
                >
                  <td
                    className={`py-4 px-6 text-sm ${index < users.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <Link
                      to={user.id}
                      className="font-medium text-primary duration-150 no-underline"
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < users.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    {user.email}
                  </td>
                  <td
                    className={`py-4 px-6 text-sm ${index < users.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    <StatusBadge status={user.status} variant="customer" />
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < users.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    {user.createdAt}
                  </td>
                  <td
                    className={`py-4 px-6 text-sm text-neutral-700 ${index < users.length - 1 ? "border-b border-neutral-200" : ""}`}
                  >
                    {user.lastLoginAt ?? "-"}
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
              baseUrl="/platform/users"
              searchParams={searchParams}
            />
          </div>
        )}
      </div>
    </div>
  );
}
