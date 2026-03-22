import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader でテナント情報を取得
// TODO: action でテナント情報更新・削除を実装

export default function TenantSettingsPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // TODO: loaderData からテナント名を取得
  const tenantName = "サロン A";

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">テナント設定</h1>

      <div className="max-w-2xl space-y-8">
        {/* テナント情報編集 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateTenant" />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                テナント名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={tenantName}
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
              <select
                id="category"
                name="category"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="hair">美容室</option>
                <option value="nail">ネイルサロン</option>
                <option value="esthetic">エステサロン</option>
                <option value="clinic">クリニック</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="urlPath"
                className="block text-sm font-medium text-gray-700"
              >
                URLパス
              </label>
              <input
                id="urlPath"
                name="urlPath"
                type="text"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {/* TODO: リアルタイム使用可否チェック */}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                住所
              </label>
              <input
                id="address"
                name="address"
                type="text"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                電話番号
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                紹介文
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* TODO: 画像アップロード・並び替え・削除（最大10枚） */}
            <div>
              <span className="block text-sm font-medium text-gray-700">
                店舗画像
              </span>
              <div className="mt-1 rounded-md border-2 border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500">
                  画像をドラッグ&ドロップまたはクリックしてアップロード（最大10枚）
                </p>
                {/* TODO: 画像アップロード機能を実装 */}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "更新中..." : "更新する"}
              </button>
            </div>
          </Form>
        </section>

        {/* テナント削除 */}
        <section className="rounded-lg border border-red-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-600">
            テナント削除
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            テナントを削除すると、すべてのデータ（メニュー、スタッフ、予約など）が完全に削除されます。この操作は取り消せません。
          </p>

          {showDeleteConfirm ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="deleteTenant" />
              <div>
                <label
                  htmlFor="confirmName"
                  className="block text-sm font-medium text-gray-700"
                >
                  確認のためテナント名「{tenantName}」を入力
                </label>
                <input
                  id="confirmName"
                  name="confirmName"
                  type="text"
                  required
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || deleteConfirmName !== tenantName}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "削除中..." : "テナントを削除"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName("");
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </Form>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              テナントを削除する
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
