import { useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";

// TODO: action で実際の登録処理を実装
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const _name = formData.get("name") as string;
  const _email = formData.get("email") as string;
  const _password = formData.get("password") as string;
  const _passwordConfirmation = formData.get("passwordConfirmation") as string;

  // TODO: バリデーション・登録処理
  return { success: true };
}

export default function AdminRegisterPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [errors] = useState<Record<string, string>>({});

  if (actionData?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            確認メールを送信しました
          </h1>
          <p className="text-gray-600">
            ご入力いただいたメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link
            to="/admin/login"
            className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
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
            管理画面アカウント登録
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            新しいアカウントを作成します
          </p>
        </div>

        <Form method="post" className="space-y-6">
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
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
              パスワード（確認）
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
            {isSubmitting ? "登録中..." : "アカウントを登録"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          既にアカウントをお持ちですか？{" "}
          <Link
            to="/admin/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
