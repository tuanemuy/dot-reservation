import { useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";

// TODO: action で実際のパスワード再設定処理を実装
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const _password = formData.get("password") as string;
  const _passwordConfirmation = formData.get("passwordConfirmation") as string;
  const _token = formData.get("token") as string;

  // TODO: パスワード再設定処理
  return { success: true };
}

export default function AdminResetPasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [errors] = useState<Record<string, string>>({});

  // TODO: URLパラメータからトークンを取得
  const token = "";

  if (actionData?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            パスワードを変更しました
          </h1>
          <p className="text-gray-600">
            新しいパスワードでログインしてください。
          </p>
          <Link
            to="/admin/login"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            新しいパスワードの設定
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            新しいパスワードを入力してください
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="token" value={token} />

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="8文字以上"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="passwordConfirmation"
              className="block text-sm font-medium text-gray-700"
            >
              新しいパスワード（確認）
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="パスワードを再入力"
            />
            {errors.passwordConfirmation && (
              <p className="mt-1 text-sm text-red-600">
                {errors.passwordConfirmation}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "設定中..." : "パスワードを設定"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          <Link
            to="/admin/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ログインページへ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
