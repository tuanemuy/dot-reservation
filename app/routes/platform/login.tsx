import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
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

export default function PlatformLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as "email" | "password";
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);
    const { error } = await authClient.signIn.email({
      email: result.data.email,
      password: result.data.password,
    });
    setIsPending(false);

    if (error) {
      setErrors({
        form: "メールアドレスまたはパスワードが正しくありません",
      });
      return;
    }

    navigate("/platform/dashboard");
  };

  return (
    <AuthLayout badge="プラットフォーム管理" title="プラットフォーム管理">
      {errors.form && (
        <div
          className="flex items-center"
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
          }}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="shrink-0"
            style={{ width: "18px", height: "18px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="メールアドレス"
          htmlFor="platform-login-email"
          error={errors.email ? [errors.email] : undefined}
        >
          <Input
            id="platform-login-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            error={errors.email}
          />
        </FormField>

        <FormField
          label="パスワード"
          htmlFor="platform-login-password"
          error={errors.password ? [errors.password] : undefined}
        >
          <Input
            id="platform-login-password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            autoComplete="current-password"
            error={errors.password}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ marginTop: "var(--space-xl)" }}
        >
          {isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div
        className="flex flex-col items-center"
        style={{ gap: "var(--space-sm)", marginTop: "var(--space-lg)" }}
      >
        <Link
          to="/platform/forgot-password"
          className="no-underline"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-500)",
          }}
        >
          パスワードをお忘れの方
        </Link>
      </div>
    </AuthLayout>
  );
}
