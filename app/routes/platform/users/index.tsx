import { data, Form, Link, useSearchParams } from "react-router";
import { Pagination } from "@/components/ui/Pagination";
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
          ユーザー管理
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
            placeholder="顧客名・メールアドレスで検索"
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
        {users.length === 0 ? (
          <p
            className="text-center"
            style={{
              padding: "var(--space-xl)",
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-500)",
            }}
          >
            ユーザーが見つかりません
          </p>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
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
              {users.map((user, index) => (
                <tr key={user.id} className="hover-table-row">
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      borderBottom:
                        index < users.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <Link
                      to={user.id}
                      className="no-underline"
                      style={{
                        fontWeight: 500,
                        color: "var(--color-primary)",
                        transition: "color var(--transition-default)",
                      }}
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < users.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {user.email}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      borderBottom:
                        index < users.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    <StatusBadge status={user.status} />
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < users.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {user.createdAt}
                  </td>
                  <td
                    style={{
                      padding: "var(--space-md) var(--space-lg)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-700)",
                      borderBottom:
                        index < users.length - 1
                          ? "1px solid var(--color-neutral-200)"
                          : "none",
                    }}
                  >
                    {user.lastLoginAt ?? "-"}
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
              baseUrl="/platform/users"
              searchParams={searchParams}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        gap: "4px",
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        background: isActive
          ? "oklch(0.55 0.12 145 / 0.1)"
          : "oklch(0.55 0.16 25 / 0.08)",
        color: isActive ? "var(--color-success)" : "var(--color-error)",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: isActive ? "var(--color-success)" : "var(--color-error)",
        }}
      />
      {statusLabels[status] ?? status}
    </span>
  );
}
