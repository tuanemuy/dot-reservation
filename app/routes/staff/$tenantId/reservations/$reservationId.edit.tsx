import { Form } from "react-router";
import type { Route } from "./+types/$reservationId.edit";

// TODO: 認証チェック
export async function loader({ params }: Route.LoaderArgs) {
  const _tenantId = params.tenantId;
  const _reservationId = params.reservationId;

  // TODO: 予約詳細・担当メニュー・空き時間枠取得
  return {
    reservation: {
      id: "",
      menuId: "",
      menuName: "",
      date: "",
      time: "",
      note: "",
    },
    menus: [] as {
      id: string;
      name: string;
      duration: number;
      price: number;
    }[],
  };
}

// TODO: 認証チェック
export async function action({ params, request }: Route.ActionArgs) {
  const _tenantId = params.tenantId;
  const _reservationId = params.reservationId;
  const _formData = await request.formData();

  // TODO: 予約変更処理
  return { success: true };
}

export default function StaffReservationEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation, menus } = loaderData;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">予約変更</h1>

      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <Form method="post" className="space-y-6">
          {/* メニュー選択 */}
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-gray-800">
              メニュー変更
            </legend>
            <p className="text-xs text-gray-500">
              担当メニュー内でのみ変更できます。スタッフは変更できません。
            </p>
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
                      defaultChecked={menu.id === reservation.menuId}
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
              日時変更
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
                  defaultValue={reservation.date}
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
                  defaultValue={reservation.time}
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
              defaultValue={reservation.note}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
            />
          </div>

          {/* 差分表示 */}
          {/* TODO: 変更前後の差分表示コンポーネント */}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => history.back()}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              変更を確定
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
