import { Link } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import type { Route } from "./+types/verify-email";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // TODO: トークンを検証してメール確認処理を実行
  // 1. authProvider でトークン検証
  // 2. メールアドレス確認済みに更新
  let verified = false;
  let errorMessage: string | null = null;

  if (token) {
    // TODO: 実際の検証ロジックを実装
    verified = true;
  } else {
    errorMessage = "無効なリンクです。";
  }

  return { verified, errorMessage };
}

export default function VerifyEmailPage({ loaderData }: Route.ComponentProps) {
  const { verified, errorMessage } = loaderData;

  if (!verified) {
    return (
      <AuthLayout title="メール確認エラー">
        <div className="text-center">
          <p className="mb-6 text-sm text-destructive">
            {errorMessage ??
              "メール確認に失敗しました。リンクの有効期限が切れている可能性があります。"}
          </p>
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
