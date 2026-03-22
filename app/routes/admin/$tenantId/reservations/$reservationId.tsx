import { useState } from "react";
import { Form, Link, useNavigation, useParams } from "react-router";

// TODO: loader で予約詳細を取得
// TODO: action で承認/却下/キャンセルを実装

// 仮データ
const mockReservation = {
  id: "1",
  status: "pending",
  customerName: "山田 太郎",
  customerEmail: "yamada@example.com",
  customerPhone: "090-1234-5678",
  menuName: "カット",
  duration: 60,
  price: 5000,
  staffName: "佐藤 花子",
  dateTime: "2024-01-15 10:00",
  notes: "初回です。",
};

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "承認待ち", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { text: "確定", className: "bg-green-100 text-green-800" },
  cancelled: { text: "キャンセル", className: "bg-red-100 text-red-800" },
  completed: { text: "完了", className: "bg-gray-100 text-gray-800" },
  rejected: { text: "却下", className: "bg-red-100 text-red-800" },
};

export default function TenantReservationDetailPage() {
  const { tenantId, reservationId: _reservationId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);

  const reservation = mockReservation;
  const status = statusLabels[reservation.status] ?? {
    text: reservation.status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/reservations`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 予約一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">予約詳細</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* ステータスと操作ボタン */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              ステータス:
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
            >
              {status.text}
            </span>
          </div>

          <div className="flex gap-2">
            {reservation.status === "pending" && (
              <>
                <Form method="post" className="inline">
                  <input type="hidden" name="intent" value="approve" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    承認
                  </button>
                </Form>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  却下
                </button>
              </>
            )}
            {reservation.status === "confirmed" && (
              <>
                <Link
                  to={`/admin/${tenantId}/reservations/${reservation.id}/edit`}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  変更
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>
        </div>

        {/* 却下理由入力 */}
        {showRejectForm && (
          <div className="rounded-lg border border-red-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-medium text-gray-900">却下理由</h3>
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="reject" />
              <textarea
                name="reason"
                rows={3}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="却下理由を入力してください"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "処理中..." : "却下する"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* キャンセル理由入力 */}
        {showCancelForm && (
          <div className="rounded-lg border border-red-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              キャンセル理由
            </h3>
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="cancel" />
              <textarea
                name="reason"
                rows={3}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="キャンセル理由を入力してください"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "処理中..." : "キャンセルする"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  戻る
                </button>
              </div>
            </Form>
          </div>
        )}

        {/* 予約詳細情報 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h2>
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">顧客名</dt>
              <dd className="text-sm text-gray-900">
                {reservation.customerName}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">
                メールアドレス
              </dt>
              <dd className="text-sm text-gray-900">
                {reservation.customerEmail}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="text-sm text-gray-900">
                {reservation.customerPhone}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">メニュー</dt>
              <dd className="text-sm text-gray-900">{reservation.menuName}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">所要時間</dt>
              <dd className="text-sm text-gray-900">
                {reservation.duration}分
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">料金</dt>
              <dd className="text-sm text-gray-900">
                &yen;{reservation.price.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">
                担当スタッフ
              </dt>
              <dd className="text-sm text-gray-900">{reservation.staffName}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-500">予約日時</dt>
              <dd className="text-sm text-gray-900">{reservation.dateTime}</dd>
            </div>
            {reservation.notes && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">備考</dt>
                <dd className="text-sm text-gray-900">{reservation.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
