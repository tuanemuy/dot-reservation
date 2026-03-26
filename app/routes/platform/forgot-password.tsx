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
        badge="プラットフォーム管理"
        title="リセットメールを送信しました"
        description="パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。"
      >
        <p className="text-center text-sm text-neutral-600 mb-6">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <Link
          to="/platform/login"
          className="block text-center font-medium text-sm text-primary no-underline"
        >
          ログインに戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="プラットフォーム管理"
      title="パスワードリセット"
      description="ご登録のメールアドレスを入力してください"
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="メールアドレス"
          htmlFor="platform-forgot-password-email"
          error={errors.email ? [errors.email] : undefined}
        >
          <Input
            id="platform-forgot-password-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            error={errors.email}
          />
        </FormField>

        {errors.form && (
          <p className="text-sm text-error mb-6">{errors.form}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "送信中..." : "リセットメールを送信"}
        </Button>
      </form>

      <Link
        to="/platform/login"
        className="block text-center font-medium mt-6 text-sm text-primary no-underline"
      >
        ログインに戻る
      </Link>
    </AuthLayout>
  );
}
