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
      // TODO: プラットフォーム管理者の認証処理を実装
      // 1. authProvider でメール・パスワード認証
      // 2. プラットフォーム管理者権限チェック
      // 3. セッション作成
      // 4. リダイレクト
      console.log("Platform login:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function PlatformLoginPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "platform-login-form",
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
      // TODO: ダッシュボードへリダイレクト
      console.log("Platform login successful");
    },
    onHandlerError: ({ error: err }) => {
      console.error("Platform login failed:", err);
    },
  });

  const isPending = fetcher.isPending("login");

  return (
    <AuthLayout
      title="プラットフォーム管理"
      description="管理者アカウントでログイン"
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
