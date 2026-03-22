import { Form, Link, useActionData, useNavigation } from "react-router";

// TODO: action で実際のログイン処理を実装
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const _email = formData.get("email") as string;
  const _password = formData.get("password") as string;

  // TODO: 認証処理
  return { error: "メールアドレスまたはパスワードが正しくありません" };
}

export default function AdminLoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">管理画面ログイン</h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>

        <Form method="post" className="space-y-6">
          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{actionData.error}</p>
            </div>
          )}

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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="パスワード"
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/admin/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              パスワードをお忘れですか？
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          アカウントをお持ちでないですか？{" "}
          <Link
            to="/admin/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
