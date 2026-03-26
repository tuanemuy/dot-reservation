import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function AdminVerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");

  if (errorCode) {
    const errorMessage =
      errorCode === "TOKEN_EXPIRED"
        ? "リンクの有効期限が切れています。再度新規登録を行ってください。"
        : "メール確認に失敗しました。リンクが無効です。";

    return (
      <AuthLayout badge="管理画面" title="メール確認エラー">
        <div
          className="mb-6 flex items-center gap-2 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 text-sm text-error"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] shrink-0"
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
          to="/admin/register"
          className="block text-center text-sm font-medium text-primary no-underline"
        >
          新規登録ページへ戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout badge="管理画面" title="メールアドレスの確認が完了しました">
      <div className="py-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="h-8 w-8 text-success"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <p className="mb-8 text-base leading-normal text-neutral-600">
          メールアドレスの確認が正常に完了しました。管理画面にログインしてご利用を開始してください。
        </p>

        <Link
          to="/admin/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium tracking-wide text-white no-underline"
        >
          管理画面にログイン
        </Link>
      </div>
    </AuthLayout>
  );
}
