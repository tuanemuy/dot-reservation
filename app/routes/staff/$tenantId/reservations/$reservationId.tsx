import { Form, Link } from "react-router";
import type { Route } from "./+types/$reservationId";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;
  const _reservationId = params.reservationId;

  // TODO: 予約詳細取得
  return {
    reservation: {
      id: "",
      status: "" as
        | "confirmed"
        | "pending"
        | "cancelled"
        | "completed"
        | "rejected",
      customerName: "",
      customerPhone: "",
      menuName: "",
      duration: 0,
      price: 0,
      dateTime: "",
      note: "",
    },
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const _reservationId = params.reservationId;
  const formData = await request.formData();
  const _intent = formData.get("intent");

  // TODO: キャンセル処理
  return { success: true };
}

const statusLabels: Record<string, string> = {
  confirmed: "確定",
  pending: "承認待ち",
  cancelled: "キャンセル",
  completed: "完了",
  rejected: "却下",
};

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
};

export default function StaffReservationDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation } = loaderData;
  const canModify =
    reservation.status === "confirmed" || reservation.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">予約詳細</h1>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[reservation.status] ?? "bg-gray-100 text-gray-700"}`}
        >
          {statusLabels[reservation.status] ?? reservation.status}
        </span>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">顧客名</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {reservation.customerName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">電話番号</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {reservation.customerPhone}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">メニュー</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {reservation.menuName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">所要時間</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {reservation.duration}分
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">料金</dt>
            <dd className="mt-1 text-sm text-gray-900">
              ¥{reservation.price.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">予約日時</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {reservation.dateTime}
            </dd>
          </div>
          {reservation.note && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-gray-500">備考</dt>
              <dd className="mt-1 text-sm text-gray-900">{reservation.note}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* アクションボタン */}
      {canModify && (
        <div className="flex gap-3">
          <Link
            to={`${reservation.id}/edit`}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            変更
          </Link>
          <Form method="post">
            <input type="hidden" name="intent" value="cancel" />
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              onClick={(e) => {
                if (!confirm("この予約をキャンセルしますか？")) {
                  e.preventDefault();
                }
              }}
            >
              キャンセル
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}
