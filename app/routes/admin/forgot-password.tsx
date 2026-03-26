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
        badge="管理画面"
        title="リセットメールを送信しました"
        description="パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。"
      >
        <p className="mb-6 text-center text-sm text-neutral-600">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <Link
          to="/admin/login"
          className="block text-center text-sm font-medium text-primary no-underline"
        >
          ログインページへ戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="管理画面"
      title="パスワードリセット"
      description="ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。"
    >
      <form method="post" {...getFormProps(form)}>
        <FormField
          label="メールアドレス"
          htmlFor={fields.email.id}
          error={fields.email.errors}
        >
          <Input
            {...getInputProps(fields.email, { type: "email" })}
            placeholder="example@email.com"
            autoComplete="email"
            error={fields.email.errors?.[0]}
          />
        </FormField>

        {formError && <p className="mb-6 text-sm text-error">{formError}</p>}

        {form.errors && (
          <p className="mb-6 text-sm text-error">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "送信中..." : "リセットリンクを送信"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Link
          to="/admin/login"
          className="text-sm text-neutral-500 no-underline"
        >
          ログインに戻る
        </Link>
      </div>
    </AuthLayout>
  );
}
