import { Form, Link } from "react-router";
import type { Route } from "./+types/forgot-password";

// TODO: 認証チェック
export async function action({ request }: Route.ActionArgs) {
  const _formData = await request.formData();

  // TODO: パスワードリセットメール送信処理
  return { sent: true };
}

export default function PlatformForgotPasswordPage({
  actionData,
}: Route.ComponentProps) {
  const isSent = actionData?.sent === true;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">
            パスワードリセット
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        {isSent ? (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-700">
              パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。
            </p>
          </div>
        ) : (
          <Form
            method="post"
            className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                リセットメールを送信
              </button>
            </div>
          </Form>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link
            to="/platform/login"
            className="font-medium text-gray-700 hover:text-gray-900"
          >
            ログインに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
