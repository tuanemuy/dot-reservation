import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
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
import type { Route } from "./+types/forgot-password";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

const handlers = {
  forgotPassword: defineHandler({
    schema: forgotPasswordSchema,
    handler: async (value, _args) => {
      // TODO: パスワードリセットメール送信を実装
      // 1. authProvider でリセットトークン生成
      // 2. メール送信
      console.log("Admin forgot password:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function AdminForgotPasswordPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, fields] = useForm({
    id: "admin-forgot-password-form",
    lastResult:
      fetcher.data?.intent === "forgotPassword" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.forgotPassword.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.forgotPassword.schema,
      });
    },
  });

  fetcher.register("forgotPassword", {
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const isPending = fetcher.isPending("forgotPassword");

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
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="forgotPassword" />

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

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "送信中..." : "リセットメールを送信"}
          </Button>
        </div>
      </fetcher.Form>

      <p className="mt-6 text-center text-sm">
        <Link to="/admin/login" className="text-text-secondary hover:underline">
          ログインページへ戻る
        </Link>
      </p>
    </AuthLayout>
  );
}
