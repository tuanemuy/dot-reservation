import { Form } from "react-router";
import type { Route } from "./+types/new";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;

  // TODO: 担当メニュー・空き時間枠取得
  return {
    menus: [] as {
      id: string;
      name: string;
      duration: number;
      price: number;
    }[],
    availableSlots: [] as {
      date: string;
      times: string[];
    }[],
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const _formData = await request.formData();

  // TODO: 代理予約登録処理
  return { success: true };
}

export default function StaffNewReservationPage({
  loaderData,
}: Route.ComponentProps) {
  const { menus } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">代理予約登録</h1>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <Form method="post" className="space-y-6">
          {/* 顧客情報 */}
          <fieldset className="space-y-4">
            <legend className="text-base font-semibold text-gray-800">
              顧客情報
            </legend>

            {/* TODO: 既存顧客検索 */}
            <div>
              <label
                htmlFor="customerName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                顧客名
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="customerPhone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                電話番号
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
            </div>
          </fieldset>

          {/* メニュー選択 */}
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-gray-800">
              メニュー選択
            </legend>
            {menus.length === 0 ? (
              <p className="text-sm text-gray-500">
                担当メニューがありません。
              </p>
            ) : (
              <div className="space-y-2">
                {menus.map((menu) => (
                  <label
                    key={menu.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="menuId"
                      value={menu.id}
                      className="text-gray-900 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {menu.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {menu.duration}分 / ¥{menu.price.toLocaleString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {/* 日時選択 */}
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-gray-800">
              日時選択
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  日付
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="time"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  時間
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* 備考 */}
          <div>
            <label
              htmlFor="note"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              備考
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => history.back()}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              登録
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
