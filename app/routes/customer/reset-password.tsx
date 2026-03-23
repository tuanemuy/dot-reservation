import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    passwordConfirmation: z
      .string()
      .min(1, "パスワード（確認）を入力してください"),
  })
  .refine((val) => val.password === val.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    passwordConfirmation?: string;
    form?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!token) {
    return (
      <AuthLayout title="無効なリンク">
        <div className="text-center">
          <p className="mb-6 text-sm text-destructive">
            パスワードリセットリンクが無効です。
          </p>
          <Link
            to="/customer/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            パスワードリセットを再送信
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({
      password,
      passwordConfirmation,
    });
    if (!result.success) {
      const fieldErrors: {
        password?: string;
        passwordConfirmation?: string;
      } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as "password" | "passwordConfirmation";
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: result.data.password,
      token,
    });
    setIsPending(false);

    if (error) {
      setErrors({
        form: "パスワードの再設定に失敗しました。リンクの有効期限が切れている可能性があります。",
      });
      return;
    }

    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <AuthLayout
        title="パスワード再設定完了"
        description="パスワードが正常に変更されました。新しいパスワードでログインしてください。"
      >
        <div className="text-center">
          <Link to="/customer/login">
            <Button>ログインページへ</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワード再設定"
      description="新しいパスワードを入力してください。"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <FormField
            label="新しいパスワード"
            htmlFor="customer-reset-password"
            error={errors.password ? [errors.password] : undefined}
            required
          >
            <Input
              id="customer-reset-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              error={errors.password}
            />
          </FormField>

          <FormField
            label="新しいパスワード（確認）"
            htmlFor="customer-reset-password-confirmation"
            error={
              errors.passwordConfirmation
                ? [errors.passwordConfirmation]
                : undefined
            }
            required
          >
            <Input
              id="customer-reset-password-confirmation"
              type="password"
              name="passwordConfirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="パスワードを再入力"
              error={errors.passwordConfirmation}
            />
          </FormField>

          {errors.form && (
            <p className="text-xs text-destructive">{errors.form}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "設定中..." : "パスワードを再設定"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
