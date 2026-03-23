import { Link } from "react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import type { Route } from "./+types/verify-email";

export default function AdminVerifyEmailPage(_props: Route.ComponentProps) {
  return (
    <AuthLayout
      title="メール確認完了"
      description="メールアドレスの確認が完了しました。ログインしてご利用ください。"
    >
      <div className="text-center">
        <Link to="/admin/login">
          <Button>管理画面ログインページへ</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
