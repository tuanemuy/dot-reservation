import { Form, Link, useNavigation, useParams } from "react-router";

// TODO: loader でメニュー情報を取得
// TODO: action でメニュー更新処理を実装

export default function TenantMenuEditPage() {
  const { tenantId, menuId: _menuId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // TODO: loaderData からメニュー情報を取得
  const menu = {
    name: "カット",
    category: "カット",
    description: "ベーシックなカットメニューです。",
    duration: 60,
    price: 5000,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/menus`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; メニュー一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">メニュー編集</h1>
      </div>

      <div className="max-w-2xl">
        <Form
          method="post"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <input type="hidden" name="intent" value="updateMenu" />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                メニュー名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={menu.name}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリー
              </label>
              <input
                id="category"
                name="category"
                type="text"
                defaultValue={menu.category}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                説明文
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={menu.description}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700"
                >
                  所要時間（分）
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  required
                  min={1}
                  defaultValue={menu.duration}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  料金（円）
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  required
                  min={0}
                  defaultValue={menu.price}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                to={`/admin/${tenantId}/menus`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "更新中..." : "メニューを更新"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
