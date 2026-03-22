import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { createCustomer } from "@/core/application/customer/createCustomer";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/register";

const registerSchema = z
  .object({
    displayName: z.string().min(1, "表示名を入力してください"),
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email("有効なメールアドレスを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    passwordConfirmation: z
      .string()
      .min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

const handlers = {
  register: defineHandler({
    schema: registerSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      // authProvider 実装後:
      // 1. authProvider でユーザー作成 -> authUserId 取得
      // 2. 確認メール送信
      // 現在は authProvider 未実装のため、仮の authUserId で顧客エンティティを作成
      const authUserId = crypto.randomUUID();

      const result = await handleUseCase(() =>
        createCustomer({
          container,
          headers: args.request.headers,
          input: {
            authUserId,
            displayName: value.displayName,
            email: value.email,
          },
        }),
      ).match(
        (r) => success({ email: r.email }),
        (e) => error({ "": [e.message] }),
      );

      return result;
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function CustomerRegisterPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, fields] = useForm({
    id: "register-form",
    lastResult: fetcher.data?.intent === "register" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.register.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.register.schema });
    },
  });

  fetcher.register("register", {
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const isPending = fetcher.isPending("register");

  if (isSubmitted) {
    return (
      <AuthLayout
        title="確認メールを送信しました"
        description="メールに記載されたリンクをクリックして、アカウントを有効化してください。"
      >
        <div className="text-center">
          <p className="mb-6 text-sm text-text-secondary">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link
            to="/customer/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ログインページへ
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="新規登録">
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="register" />

        <div className="space-y-5">
          <FormField
            label="表示名"
            htmlFor={fields.displayName.id}
            error={fields.displayName.errors}
            required
          >
            <Input
              {...getInputProps(fields.displayName, { type: "text" })}
              placeholder="山田 太郎"
              error={fields.displayName.errors?.[0]}
            />
          </FormField>

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
              placeholder="8文字以上"
              error={fields.password.errors?.[0]}
            />
          </FormField>

          <FormField
            label="パスワード（確認）"
            htmlFor={fields.passwordConfirmation.id}
            error={fields.passwordConfirmation.errors}
            required
          >
            <Input
              {...getInputProps(fields.passwordConfirmation, {
                type: "password",
              })}
              placeholder="パスワードを再入力"
              error={fields.passwordConfirmation.errors?.[0]}
            />
          </FormField>

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登録中..." : "新規登録"}
          </Button>
        </div>
      </fetcher.Form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        すでにアカウントをお持ちですか？{" "}
        <Link
          to="/customer/login"
          className="font-medium text-primary hover:underline"
        >
          ログイン
        </Link>
      </p>
    </AuthLayout>
  );
}
