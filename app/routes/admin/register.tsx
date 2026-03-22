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
import type { Route } from "./+types/register";

const registerSchema = z
  .object({
    name: z.string().min(1, "氏名を入力してください"),
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
    handler: async (value, _args) => {
      // TODO: 認証サービスを使ってアカウント作成を実装
      // 1. authProvider でユーザー作成
      // 2. createMemberAccount ユースケースでメンバーアカウント作成
      // 3. 確認メール送信
      console.log("Admin register:", value);
      return success({ email: value.email });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function AdminRegisterPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, fields] = useForm({
    id: "admin-register-form",
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
    onHandlerError: ({ error: err }) => {
      console.error("Admin registration failed:", err);
    },
  });

  const isPending = fetcher.isPending("register");

  if (isSubmitted) {
    return (
      <AuthLayout
        title="確認メールを送信しました"
        description="ご入力いただいたメールアドレスに確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。"
      >
        <div className="text-center">
          <p className="mb-6 text-sm text-text-secondary">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link
            to="/admin/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            ログインページへ
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="管理画面アカウント登録"
      description="新しいアカウントを作成します"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="register" />

        <div className="space-y-5">
          <FormField
            label="氏名"
            htmlFor={fields.name.id}
            error={fields.name.errors}
            required
          >
            <Input
              {...getInputProps(fields.name, { type: "text" })}
              placeholder="山田 太郎"
              error={fields.name.errors?.[0]}
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
            {isPending ? "登録中..." : "アカウントを登録"}
          </Button>
        </div>
      </fetcher.Form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        既にアカウントをお持ちですか？{" "}
        <Link
          to="/admin/login"
          className="font-medium text-primary hover:underline"
        >
          ログイン
        </Link>
      </p>
    </AuthLayout>
  );
}
