import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader でプロフィール情報を取得
// TODO: action でプロフィール更新・パスワード変更・アカウント削除を実装

export default function AdminProfilePage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        プロフィール設定
      </h1>

      <div className="max-w-2xl space-y-8">
        {/* プロフィール編集 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateProfile" />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                氏名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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

        {/* パスワード変更 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            パスワード変更
          </h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="changePassword" />

            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                現在のパスワード
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                新しいパスワード
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="newPasswordConfirmation"
                className="block text-sm font-medium text-gray-700"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="newPasswordConfirmation"
                name="newPasswordConfirmation"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "変更中..." : "パスワードを変更"}
              </button>
            </div>
          </Form>
        </section>

        {/* アカウント削除 */}
        <section className="rounded-lg border border-red-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-600">
            アカウント削除
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </p>

          {showDeleteConfirm ? (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="deleteAccount" />
              <div>
                <label
                  htmlFor="deletePassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  確認のためパスワードを入力
                </label>
                <input
                  id="deletePassword"
                  name="password"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "削除中..." : "アカウントを削除"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
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
              アカウントを削除する
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
