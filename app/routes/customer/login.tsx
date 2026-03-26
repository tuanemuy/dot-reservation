import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AlertError } from "@/components/ui/AlertError";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authClient } from "@/lib/authClient";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [form, fields] = useForm({
    id: "customer-login-form",
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

          navigate("/mypage/reservations");
        })
        .catch(() => {
          setFormError("ログインに失敗しました。");
          setIsPending(false);
        });
    },
  });

  return (
    <AuthLayout title="ログイン">
      {formError && (
        <div className="mb-6">
          <AlertError error={formError} />
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
          <p className="text-sm text-error mb-6">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 mt-6">
        <Link
          to="/customer/forgot-password"
          className="text-sm text-neutral-500 no-underline"
        >
          パスワードをお忘れの方
        </Link>
        <Link
          to="/customer/register"
          className="font-medium text-sm text-primary no-underline"
        >
          新規会員登録はこちら
        </Link>
      </div>
    </AuthLayout>
  );
}
