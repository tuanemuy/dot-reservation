import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";
import type { Route } from "./+types/login";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export default function AdminLoginPage(_props: Route.ComponentProps) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [form, fields] = useForm({
    id: "admin-login-form",
    constraint: getZodConstraint(loginSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    onSubmit(event) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const parsed = parseWithZod(formData, { schema: loginSchema });
      if (parsed.status !== "success") {
        return;
      }

      setFormError(null);
      setIsPending(true);

      const { email, password } = parsed.value;

      authClient.signIn
        .email({
          email,
          password,
        })
        .then(({ error: signInError }) => {
          if (signInError) {
            setFormError("メールアドレスまたはパスワードが正しくありません");
            setIsPending(false);
            return;
          }

          navigate("/admin/tenants");
        })
        .catch(() => {
          setFormError("ログインに失敗しました。");
          setIsPending(false);
        });
    },
  });

  return (
    <AuthLayout badge="管理画面" title="管理画面ログイン">
      {formError && (
        <div
          className="flex items-center gap-2 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 mb-6 text-sm text-error"
          role="alert"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {formError}
        </div>
      )}

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

        <FormField
          label="パスワード"
          htmlFor={fields.password.id}
          error={fields.password.errors}
        >
          <Input
            {...getInputProps(fields.password, { type: "password" })}
            placeholder="パスワードを入力"
            autoComplete="current-password"
            error={fields.password.errors?.[0]}
          />
        </FormField>

        {form.errors && (
          <p className="mb-6 text-sm text-error">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Link
          to="/admin/forgot-password"
          className="text-sm text-neutral-500 no-underline"
        >
          パスワードをお忘れの方
        </Link>
        <Link
          to="/admin/register"
          className="text-sm font-medium text-primary no-underline"
        >
          新規アカウント登録はこちら
        </Link>
      </div>
    </AuthLayout>
  );
}
