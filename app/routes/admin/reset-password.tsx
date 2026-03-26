import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";
import type { Route } from "./+types/reset-password";

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

export default function AdminResetPasswordPage(_props: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isCompleted, setIsCompleted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [form, fields] = useForm({
    id: "admin-reset-password-form",
    constraint: getZodConstraint(resetPasswordSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: resetPasswordSchema });
    },
    onSubmit(event) {
      event.preventDefault();

      if (!token) {
        setFormError("無効なリンクです。");
        return;
      }

      const formData = new FormData(event.currentTarget);
      const parsed = parseWithZod(formData, { schema: resetPasswordSchema });
      if (parsed.status !== "success") {
        return;
      }

      setFormError(null);
      setIsPending(true);

      authClient
        .resetPassword({
          newPassword: parsed.value.password,
          token,
        })
        .then(({ error: resetError }) => {
          if (resetError) {
            setFormError(
              resetError.message ?? "パスワードの再設定に失敗しました。",
            );
            setIsPending(false);
            return;
          }

          setIsCompleted(true);
          setIsPending(false);
        })
        .catch(() => {
          setFormError("パスワードの再設定に失敗しました。");
          setIsPending(false);
        });
    },
  });

  if (!token) {
    return (
      <AuthLayout badge="管理画面" title="新しいパスワードを設定">
        <div
          className="mb-6 flex items-start gap-2 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 text-sm leading-normal text-error"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="mt-[2px] h-[18px] w-[18px] shrink-0"
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
          to="/admin/forgot-password"
          className="block text-center text-sm font-medium text-primary no-underline"
        >
          パスワードリセットを再送信
        </Link>
      </AuthLayout>
    );
  }

  if (isCompleted) {
    return (
      <AuthLayout
        badge="管理画面"
        title="パスワード再設定完了"
        description="パスワードが正常に変更されました。新しいパスワードでログインしてください。"
      >
        <Link
          to="/admin/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-8 text-base font-medium tracking-wide text-white no-underline"
        >
          ログインページへ
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="管理画面"
      title="新しいパスワードを設定"
      description="新しいパスワードを入力してください。"
    >
      {formError && (
        <div
          className="mb-6 flex items-start gap-2 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 text-sm leading-normal text-error"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="mt-[2px] h-[18px] w-[18px] shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <form method="post" {...getFormProps(form)}>
        <FormField
          label="新しいパスワード"
          htmlFor={fields.password.id}
          error={fields.password.errors}
        >
          <Input
            {...getInputProps(fields.password, { type: "password" })}
            placeholder="8文字以上で入力"
            autoComplete="new-password"
            error={fields.password.errors?.[0]}
          />
        </FormField>

        <FormField
          label="パスワード確認"
          htmlFor={fields.passwordConfirmation.id}
          error={fields.passwordConfirmation.errors}
        >
          <Input
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
            placeholder="パスワードを再入力"
            autoComplete="new-password"
            error={fields.passwordConfirmation.errors?.[0]}
          />
        </FormField>

        {form.errors && (
          <p className="mb-6 text-sm text-error">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "設定中..." : "パスワードを変更"}
        </Button>
      </form>
    </AuthLayout>
  );
}
