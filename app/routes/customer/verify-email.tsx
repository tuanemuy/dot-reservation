import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");

  if (errorCode) {
    const errorMessage =
      errorCode === "TOKEN_EXPIRED"
        ? "リンクの有効期限が切れています。再度新規登録を行ってください。"
        : "メール確認に失敗しました。リンクが無効です。";

    return (
      <AuthLayout title="メール確認エラー">
        <div
          className="flex items-center gap-2 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-md mb-6 text-sm text-error"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0 size-[18px]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {errorMessage}
        </div>
        <Link
          to="/customer/register"
          className="block text-center font-medium text-sm text-primary no-underline"
        >
          新規登録ページへ戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="メールアドレスの確認が完了しました">
      <div className="text-center py-6">
        <div className="mx-auto flex items-center justify-center size-[72px] rounded-full bg-primary-lighter mb-6">
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="size-9 text-success"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <p className="text-base text-neutral-600 leading-relaxed mb-8">
          アカウントの認証が完了しました。
          <br />
          ログインしてサービスをご利用ください。
        </p>

        <Link
          to="/customer/login"
          className="inline-flex w-full items-center justify-center font-medium h-[44px] px-8 bg-primary text-white rounded-md text-base tracking-wide no-underline"
        >
          ログインページへ
        </Link>
      </div>
    </AuthLayout>
  );
}
