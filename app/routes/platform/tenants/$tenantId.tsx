import { Form } from "react-router";
import type { Route } from "./+types/$tenantId";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: テナント詳細取得
  return {
    tenant: {
      id: "",
      name: "",
      category: "",
      urlPath: "",
      address: "",
      phone: "",
      status: "" as "active" | "suspended",
      createdAt: "",
    },
    members: [] as {
      id: string;
      name: string;
      email: string;
      role: string;
    }[],
    stats: {
      menuCount: 0,
      totalReservations: 0,
      monthlyReservations: 0,
    },
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const formData = await request.formData();
  const _intent = formData.get("intent");

  // TODO: 停止・再開・削除処理
  return { success: true };
}

const statusLabels: Record<string, string> = {
  active: "アクティブ",
  suspended: "停止中",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
};

export default function PlatformTenantDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant, members, stats } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[tenant.status] ?? "bg-gray-100 text-gray-700"}`}
        >
          {statusLabels[tenant.status] ?? tenant.status}
        </span>
      </div>

      {/* 基本情報 */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-800">基本情報</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">テナント名</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">カテゴリー</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.category}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">URLパス</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.urlPath}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">住所</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.address}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">電話番号</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">登録日</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.createdAt}</dd>
          </div>
        </dl>
      </div>

      {/* 統計情報 */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-800">統計情報</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">メニュー数</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {stats.menuCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">総予約数</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {stats.totalReservations.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">今月の予約数</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {stats.monthlyReservations.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-800">
          メンバー一覧
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">メンバーがいません</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="pb-2 font-medium text-gray-700">名前</th>
                <th className="pb-2 font-medium text-gray-700">
                  メールアドレス
                </th>
                <th className="pb-2 font-medium text-gray-700">ロール</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="py-2 text-gray-900">{member.name}</td>
                  <td className="py-2 text-gray-600">{member.email}</td>
                  <td className="py-2">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {member.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* アクション */}
      <div className="flex gap-3">
        {tenant.status === "active" ? (
          <Form method="post">
            <input type="hidden" name="intent" value="suspend" />
            <button
              type="submit"
              className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
              onClick={(e) => {
                if (!confirm("このテナントを停止しますか？")) {
                  e.preventDefault();
                }
              }}
            >
              テナントを停止
            </button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="intent" value="resume" />
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
              onClick={(e) => {
                if (!confirm("このテナントを再開しますか？")) {
                  e.preventDefault();
                }
              }}
            >
              テナントを再開
            </button>
          </Form>
        )}
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
            onClick={(e) => {
              const confirmed = prompt(
                "削除するにはテナント名を入力してください:",
              );
              if (confirmed !== tenant.name) {
                e.preventDefault();
              }
            }}
          >
            テナントを削除
          </button>
        </Form>
      </div>
    </div>
  );
}
