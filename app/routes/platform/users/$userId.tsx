import { Form } from "react-router";
import type { Route } from "./+types/$userId";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _userId = params.userId;

  // TODO: ユーザー詳細取得
  return {
    user: {
      id: "",
      name: "",
      email: "",
      phone: "",
      status: "" as "active" | "suspended",
      createdAt: "",
      lastLoginAt: null as string | null,
    },
    reservationStats: {
      totalCount: 0,
      recentReservations: [] as {
        id: string;
        tenantName: string;
        menuName: string;
        dateTime: string;
        status: string;
      }[],
    },
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _userId = params.userId;
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

export default function PlatformUserDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { user, reservationStats } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[user.status] ?? "bg-gray-100 text-gray-700"}`}
        >
          {statusLabels[user.status] ?? user.status}
        </span>
      </div>

      {/* 基本情報 */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-800">基本情報</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">ユーザー名</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">
              メールアドレス
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">電話番号</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">登録日</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.createdAt}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">最終ログイン</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.lastLoginAt ?? "-"}
            </dd>
          </div>
        </dl>
      </div>

      {/* 予約履歴 */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">予約履歴</h2>
          <p className="text-sm text-gray-500">
            総予約数: {reservationStats.totalCount.toLocaleString()}件
          </p>
        </div>
        {reservationStats.recentReservations.length === 0 ? (
          <p className="text-sm text-gray-500">予約履歴がありません</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="pb-2 font-medium text-gray-700">店舗</th>
                <th className="pb-2 font-medium text-gray-700">メニュー</th>
                <th className="pb-2 font-medium text-gray-700">日時</th>
                <th className="pb-2 font-medium text-gray-700">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservationStats.recentReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="py-2 text-gray-900">
                    {reservation.tenantName}
                  </td>
                  <td className="py-2 text-gray-600">{reservation.menuName}</td>
                  <td className="py-2 text-gray-600">{reservation.dateTime}</td>
                  <td className="py-2">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {reservation.status}
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
        {user.status === "active" ? (
          <Form method="post">
            <input type="hidden" name="intent" value="suspend" />
            <button
              type="submit"
              className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
              onClick={(e) => {
                if (!confirm("このユーザーを停止しますか？")) {
                  e.preventDefault();
                }
              }}
            >
              アカウントを停止
            </button>
          </Form>
        ) : (
          <Form method="post">
            <input type="hidden" name="intent" value="resume" />
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
              onClick={(e) => {
                if (!confirm("このユーザーを再開しますか？")) {
                  e.preventDefault();
                }
              }}
            >
              アカウントを再開
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
                "削除するには「削除」と入力してください:",
              );
              if (confirmed !== "削除") {
                e.preventDefault();
              }
            }}
          >
            アカウントを削除
          </button>
        </Form>
      </div>
    </div>
  );
}
