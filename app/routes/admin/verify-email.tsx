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
          className="flex items-center"
          role="alert"
          style={{
            gap: "var(--space-sm)",
            padding: "var(--space-md)",
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-lg)",
            fontSize: "var(--text-sm)",
            color: "var(--color-error)",
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "18px", height: "18px" }}
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
          className="block text-center font-medium no-underline"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}
        >
          新規登録ページへ戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout badge="管理画面" title="メールアドレスの確認が完了しました">
      <div className="text-center" style={{ padding: "var(--space-lg) 0" }}>
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-full)",
            background: "oklch(0.55 0.12 145 / 0.1)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{
              width: "32px",
              height: "32px",
              color: "var(--color-success)",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <p
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-neutral-600)",
            lineHeight: "var(--leading-normal)",
            marginBottom: "var(--space-xl)",
          }}
        >
          メールアドレスの確認が正常に完了しました。管理画面にログインしてご利用を開始してください。
        </p>

        <Link
          to="/admin/login"
          className="inline-flex w-full items-center justify-center font-medium no-underline"
          style={{
            height: "44px",
            padding: "0 var(--space-xl)",
            background: "var(--color-primary)",
            color: "#FFFFFF",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          管理画面にログイン
        </Link>
      </div>
    </AuthLayout>
  );
}
