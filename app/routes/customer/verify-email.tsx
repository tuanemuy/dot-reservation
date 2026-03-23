import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";

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
        <div className="text-center">
          <p className="mb-6 text-sm text-destructive">{errorMessage}</p>
          <Link
            to="/customer/register"
            className="text-sm font-medium text-primary hover:underline"
          >
            新規登録ページへ戻る
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="メール確認完了"
      description="メールアドレスの確認が完了しました。ログインしてサービスをご利用ください。"
    >
      <div className="text-center">
        <Link to="/customer/login">
          <Button>ログインページへ</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
