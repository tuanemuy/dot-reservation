import { Form, Link, useActionData, useNavigation } from "react-router";

// TODO: action でパスワードリセットメール送信処理を実装
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const _email = formData.get("email") as string;

  // TODO: パスワードリセットメール送信
  return { success: true };
}

export default function AdminForgotPasswordPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            リセットメールを送信しました
          </h1>
          <p className="text-gray-600">
            ご入力いただいたメールアドレスにパスワードリセット用のリンクを送信しました。メールをご確認ください。
          </p>
          <Link
            to="/admin/login"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ログインページへ戻る
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
            パスワードリセット
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <Form method="post" className="space-y-6">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "送信中..." : "リセットメールを送信"}
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
