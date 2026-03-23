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
    <AuthLayout
      title="プラットフォーム管理"
      description="管理者アカウントでログイン"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <FormField
            label="メールアドレス"
            htmlFor="platform-login-email"
            error={errors.email ? [errors.email] : undefined}
            required
          >
            <Input
              id="platform-login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              error={errors.email}
            />
          </FormField>

          <FormField
            label="パスワード"
            htmlFor="platform-login-password"
            error={errors.password ? [errors.password] : undefined}
            required
          >
            <Input
              id="platform-login-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              error={errors.password}
            />
          </FormField>

          {errors.form && (
            <p className="text-xs text-destructive">{errors.form}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          to="/platform/forgot-password"
          className="text-text-secondary hover:underline"
        >
          パスワードをお忘れの方
        </Link>
      </p>
    </AuthLayout>
  );
}
