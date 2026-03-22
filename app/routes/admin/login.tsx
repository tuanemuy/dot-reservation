import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import type { Route } from "./+types/login";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

const handlers = {
  login: defineHandler({
    schema: loginSchema,
    handler: async (value, _args) => {
      // TODO: 認証サービスを使ってログイン処理を実装
      // 1. authProvider でメール・パスワード認証
      // 2. セッション作成
      // 3. リダイレクト
      console.log("Admin login:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function AdminLoginPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "admin-login-form",
    lastResult: fetcher.data?.intent === "login" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.login.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.login.schema });
    },
  });

  fetcher.register("login", {
    onSuccess: () => {
      // TODO: ログイン成功後、テナント選択ページへリダイレクト
      console.log("Admin login successful");
    },
    onHandlerError: ({ error: err }) => {
      console.error("Admin login failed:", err);
    },
  });

  const isPending = fetcher.isPending("login");

  return (
    <AuthLayout
      title="管理画面ログイン"
      description="アカウントにログインしてください"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="login" />

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

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </div>
      </fetcher.Form>

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
