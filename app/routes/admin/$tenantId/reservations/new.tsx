import { Form, Link, useNavigation, useParams } from "react-router";

// TODO: loader でメニュー一覧・スタッフ一覧を取得
// TODO: action で代理予約登録を実装

// 仮データ
const mockMenus = [
  { id: "1", name: "カット", duration: 60, price: 5000 },
  { id: "2", name: "カラー", duration: 90, price: 8000 },
  { id: "3", name: "パーマ", duration: 120, price: 10000 },
];

const mockStaff = [
  { id: "1", name: "佐藤 花子" },
  { id: "2", name: "田中 次郎" },
];

export default function TenantReservationNewPage() {
  const { tenantId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/reservations`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 予約一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">代理予約登録</h1>
      </div>

      <div className="max-w-2xl">
        <Form
          method="post"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="space-y-6">
            {/* 顧客情報 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                顧客情報
              </h2>
              {/* TODO: 既存顧客検索 */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    顧客名
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerPhone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    電話番号
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="090-1234-5678"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    メールアドレス
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </section>

            {/* メニュー選択 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                メニュー
              </h2>
              <select
                name="menuId"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">メニューを選択</option>
                {mockMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} ({menu.duration}分 / &yen;
                    {menu.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </section>

            {/* スタッフ選択 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                担当スタッフ
              </h2>
              <select
                name="staffId"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">指名なし</option>
                {mockStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </section>

            {/* 日時選択 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">日時</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    日付
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700"
                  >
                    時刻
                  </label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* TODO: 空き時間枠から選択する UI */}
            </section>

            {/* 備考 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">備考</h2>
              <textarea
                name="notes"
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="備考を入力..."
              />
            </section>

            {/* ボタン */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <Link
                to={`/admin/${tenantId}/reservations`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "登録中..." : "予約を登録"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
