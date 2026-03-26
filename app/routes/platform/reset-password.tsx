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

export default function PlatformResetPasswordPage() {
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
      <AuthLayout badge="プラットフォーム管理" title="新しいパスワードの設定">
        <div
          className="flex items-start gap-2 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-md mb-6 text-sm text-error leading-normal"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0 size-[18px] mt-[2px]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>
            リセットリンクの有効期限が切れています。お手数ですが、再度パスワードリセットをリクエストしてください。
          </span>
        </div>
        <Link
          to="/platform/forgot-password"
          className="block text-center font-medium text-sm text-primary no-underline"
        >
          パスワードリセットを再送信
        </Link>
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
        badge="プラットフォーム管理"
        title="パスワード再設定完了"
        description="パスワードが正常に変更されました。"
      >
        <Link
          to="/platform/login"
          className="inline-flex w-full items-center justify-center font-medium h-[44px] px-8 bg-primary text-white rounded-md text-base tracking-wide no-underline"
        >
          ログインページへ
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="プラットフォーム管理"
      title="新しいパスワードの設定"
      description="新しいパスワードを入力してください"
    >
      {errors.form && (
        <div
          className="flex items-start gap-2 p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-md mb-6 text-sm text-error leading-normal"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0 size-[18px] mt-[2px]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="新しいパスワード"
          htmlFor="platform-reset-password"
          error={errors.password ? [errors.password] : undefined}
        >
          <Input
            id="platform-reset-password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新しいパスワードを入力"
            autoComplete="new-password"
            error={errors.password}
          />
          <p className="text-xs text-neutral-500 mt-1">
            8文字以上の英数字を含むパスワードを設定してください
          </p>
        </FormField>

        <FormField
          label="パスワード（確認）"
          htmlFor="platform-reset-password-confirmation"
          error={
            errors.passwordConfirmation
              ? [errors.passwordConfirmation]
              : undefined
          }
        >
          <Input
            id="platform-reset-password-confirmation"
            type="password"
            name="passwordConfirmation"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="パスワードを再入力"
            autoComplete="new-password"
            error={errors.passwordConfirmation}
          />
        </FormField>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "設定中..." : "パスワードを変更"}
        </Button>
      </form>
    </AuthLayout>
  );
}
