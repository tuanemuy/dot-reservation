import { Form, Link, useNavigation, useParams } from "react-router";

// TODO: action でメニュー登録処理を実装

export default function TenantMenuNewPage() {
  const { tenantId } = useParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/menus`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; メニュー一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">メニュー登録</h1>
      </div>

      <div className="max-w-2xl">
        <Form
          method="post"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: カット"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: カット"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="メニューの説明を入力..."
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="60"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="5000"
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
                {isSubmitting ? "登録中..." : "メニューを登録"}
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
