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
      <AuthLayout title="無効なリンク">
        <div className="text-center">
          <p className="mb-6 text-sm text-destructive">
            パスワードリセットリンクが無効です。
          </p>
          <Link
            to="/admin/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            パスワードリセットを再送信
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isCompleted) {
    return (
      <AuthLayout
        title="パスワード再設定完了"
        description="パスワードが正常に変更されました。新しいパスワードでログインしてください。"
      >
        <div className="text-center">
          <Link to="/admin/login">
            <Button>ログインページへ</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="新しいパスワードの設定"
      description="新しいパスワードを入力してください。"
    >
      <form method="post" {...getFormProps(form)}>
        <div className="space-y-5">
          <FormField
            label="新しいパスワード"
            htmlFor={fields.password.id}
            error={fields.password.errors}
            required
          >
            <Input
              {...getInputProps(fields.password, { type: "password" })}
              placeholder="8文字以上"
              error={fields.password.errors?.[0]}
            />
          </FormField>

          <FormField
            label="新しいパスワード（確認）"
            htmlFor={fields.passwordConfirmation.id}
            error={fields.passwordConfirmation.errors}
            required
          >
            <Input
              {...getInputProps(fields.passwordConfirmation, {
                type: "password",
              })}
              placeholder="パスワードを再入力"
              error={fields.passwordConfirmation.errors?.[0]}
            />
          </FormField>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "設定中..." : "パスワードを設定"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/admin/login" className="text-text-secondary hover:underline">
          ログインページへ戻る
        </Link>
      </p>
    </AuthLayout>
  );
}
