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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, fields] = useForm({
    id: "customer-forgot-password-form",
    constraint: getZodConstraint(forgotPasswordSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: forgotPasswordSchema });
    },
    onSubmit(event) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const parsed = parseWithZod(formData, {
        schema: forgotPasswordSchema,
      });
      if (parsed.status !== "success") {
        return;
      }

      setIsPending(true);

      authClient
        .requestPasswordReset({
          email: parsed.value.email,
          redirectTo: "/customer/reset-password",
        })
        .then(() => {
          setIsPending(false);
          setIsSubmitted(true);
        })
        .catch(() => {
          setIsPending(false);
          setIsSubmitted(true);
        });
    },
  });

  if (isSubmitted) {
    return (
      <AuthLayout
        title="リセットメールを送信しました"
        description="パスワードリセット用のメールを送信しました。メールに記載されたリンクからパスワードを再設定してください。"
      >
        <p
          className="text-center"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-600)",
            marginBottom: "var(--space-lg)",
          }}
        >
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <Link
          to="/customer/login"
          className="block text-center font-medium no-underline"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}
        >
          ログインに戻る
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワードリセット"
      description="ご登録のメールアドレスを入力してください"
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

        {form.errors && (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-error)",
              marginBottom: "var(--space-lg)",
            }}
          >
            {form.errors}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "送信中..." : "リセットメールを送信"}
        </Button>
      </form>

      <Link
        to="/customer/login"
        className="block text-center font-medium no-underline"
        style={{
          marginTop: "var(--space-lg)",
          fontSize: "var(--text-sm)",
          color: "var(--color-primary)",
        }}
      >
        ログインに戻る
      </Link>
    </AuthLayout>
  );
}
