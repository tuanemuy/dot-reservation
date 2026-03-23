import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";
import type { Route } from "./+types/forgot-password";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

export default function AdminForgotPasswordPage(_props: Route.ComponentProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [form, fields] = useForm({
    id: "admin-forgot-password-form",
    constraint: getZodConstraint(forgotPasswordSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: forgotPasswordSchema });
    },
    onSubmit(event) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const parsed = parseWithZod(formData, { schema: forgotPasswordSchema });
      if (parsed.status !== "success") {
        return;
      }

      setFormError(null);
      setIsPending(true);

      authClient
        .requestPasswordReset({
          email: parsed.value.email,
          redirectTo: "/admin/reset-password",
        })
        .then(() => {
          setIsSubmitted(true);
          setIsPending(false);
        })
        .catch(() => {
          setFormError("送信に失敗しました。");
          setIsPending(false);
        });
    },
  });

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
            to="/admin/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ログインページへ戻る
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワードリセット"
      description="登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。"
    >
      <form method="post" {...getFormProps(form)}>
        <div className="space-y-5">
          <FormField
            label="メールアドレス"
            htmlFor={fields.email.id}
            error={fields.email.errors}
            required
          >
            <Input
              {...getInputProps(fields.email, { type: "email" })}
              placeholder="example@email.com"
              error={fields.email.errors?.[0]}
            />
          </FormField>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "送信中..." : "リセットメールを送信"}
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
