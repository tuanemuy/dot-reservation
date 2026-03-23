import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

export default function PlatformForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email") {
          fieldErrors.email = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    await authClient.requestPasswordReset({
      email: result.data.email,
      redirectTo: "/platform/reset-password",
    });
    setIsPending(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="リセットメールを送信しました"
        description="パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。"
      >
        <div className="text-center">
          <p className="mb-6 text-sm text-text-secondary">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link
            to="/platform/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ログインに戻る
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワードリセット"
      description="登録済みのメールアドレスを入力してください"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <FormField
            label="メールアドレス"
            htmlFor="platform-forgot-password-email"
            error={errors.email ? [errors.email] : undefined}
            required
          >
            <Input
              id="platform-forgot-password-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              error={errors.email}
            />
          </FormField>

          {errors.form && (
            <p className="text-xs text-destructive">{errors.form}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "送信中..." : "リセットメールを送信"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          to="/platform/login"
          className="text-text-secondary hover:underline"
        >
          ログインに戻る
        </Link>
      </p>
    </AuthLayout>
  );
}
