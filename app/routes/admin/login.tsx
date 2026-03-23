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
    <AuthLayout
      title="管理画面ログイン"
      description="アカウントにログインしてください"
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

          <FormField
            label="パスワード"
            htmlFor={fields.password.id}
            error={fields.password.errors}
            required
          >
            <Input
              {...getInputProps(fields.password, { type: "password" })}
              placeholder="パスワード"
              error={fields.password.errors?.[0]}
            />
          </FormField>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <p>
          <Link
            to="/admin/forgot-password"
            className="text-text-secondary hover:underline"
          >
            パスワードをお忘れですか？
          </Link>
        </p>
        <p className="text-text-secondary">
          アカウントをお持ちでないですか？{" "}
          <Link
            to="/admin/register"
            className="font-medium text-primary hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
