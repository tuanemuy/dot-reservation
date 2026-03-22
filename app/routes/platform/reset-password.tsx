import { Form, Link } from "react-router";
import type { Route } from "./+types/reset-password";

// TODO: 認証チェック、トークン検証
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const _token = url.searchParams.get("token");

  // TODO: トークンの有効性チェック
  return {
    tokenValid: true,
  };
}

// TODO: 認証チェック
export async function action({ request }: Route.ActionArgs) {
  const _formData = await request.formData();

  // TODO: パスワード再設定処理
  return { success: true };
}

export default function PlatformResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { tokenValid } = loaderData;
  const isSuccess = actionData?.success === true;

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="mb-3 text-sm text-red-600">
              このリンクは期限切れです。パスワードリセットを再度お試しください。
            </p>
            <Link
              to="/platform/forgot-password"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              パスワードリセットページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="mb-4 text-sm text-gray-700">
              パスワードが正常に変更されました。
            </p>
            <Link
              to="/platform/login"
              className="inline-flex w-full justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">パスワード再設定</h1>
          <p className="mt-1 text-sm text-gray-500">
            新しいパスワードを入力してください
          </p>
        </div>

        <Form
          method="post"
          className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                新しいパスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="passwordConfirmation"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                パスワード（確認）
              </label>
              <input
                type="password"
                id="passwordConfirmation"
                name="passwordConfirmation"
                required
                minLength={8}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              パスワードを変更
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
