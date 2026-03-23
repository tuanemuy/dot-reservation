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
      <AuthLayout title="新しいパスワードの設定">
        <div
          className="flex items-start"
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
            lineHeight: "var(--leading-normal)",
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "18px", height: "18px", marginTop: "2px" }}
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

        <FormField label="新しいパスワード" htmlFor="disabled-pw">
          <Input
            id="disabled-pw"
            type="password"
            placeholder="8文字以上"
            autoComplete="new-password"
            disabled
          />
        </FormField>

        <FormField label="パスワード（確認）" htmlFor="disabled-pw-confirm">
          <Input
            id="disabled-pw-confirm"
            type="password"
            placeholder="パスワードを再入力"
            autoComplete="new-password"
            disabled
          />
        </FormField>

        <Button type="button" disabled className="w-full">
          パスワードを変更する
        </Button>
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
        <Link
          to="/customer/login"
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
          ログインページへ
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="新しいパスワードの設定">
      {errors.form && (
        <div
          className="flex items-start"
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
            lineHeight: "var(--leading-normal)",
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "18px", height: "18px", marginTop: "2px" }}
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
          htmlFor="customer-reset-password"
          error={errors.password ? [errors.password] : undefined}
        >
          <Input
            id="customer-reset-password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            autoComplete="new-password"
            error={errors.password}
          />
        </FormField>

        <FormField
          label="パスワード（確認）"
          htmlFor="customer-reset-password-confirmation"
          error={
            errors.passwordConfirmation
              ? [errors.passwordConfirmation]
              : undefined
          }
        >
          <Input
            id="customer-reset-password-confirmation"
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
          {isPending ? "設定中..." : "パスワードを変更する"}
        </Button>
      </form>
    </AuthLayout>
  );
}
