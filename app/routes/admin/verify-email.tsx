import { Link } from "react-router";

// TODO: loader でトークン検証を実装
export async function loader({
  request,
}: {
  request: Request;
}): Promise<{ verified: boolean }> {
  const url = new URL(request.url);
  const _token = url.searchParams.get("token");

  // TODO: トークン検証処理
  return { verified: true };
}

export default function AdminVerifyEmailPage() {
  // TODO: loaderData から verified を受け取る

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
          メールアドレスの確認が完了しました
        </h1>
        <p className="text-gray-600">
          アカウントの登録が完了しました。ログインしてご利用ください。
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
