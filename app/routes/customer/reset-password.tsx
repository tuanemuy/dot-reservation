import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data, Link } from "react-router";
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
import type { Route } from "./+types/reset-password";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    passwordConfirmation: z
      .string()
      .min(1, "パスワード（確認）を入力してください"),
  })
  .refine((val) => val.password === val.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

const handlers = {
  resetPassword: defineHandler({
    schema: resetPasswordSchema,
    handler: async (value, _args) => {
      // TODO: パスワード再設定を実装
      // 1. authProvider でトークン検証
      // 2. パスワード更新
      console.log("Reset password:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw data({ message: "無効なリンクです" }, { status: 400 });
  }

  // TODO: トークンの有効性を事前チェック
  return { token, expired: false };
}

export default function ResetPasswordPage({
  loaderData,
}: Route.ComponentProps) {
  const { token, expired } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [isCompleted, setIsCompleted] = useState(false);

  const [form, fields] = useForm({
    id: "reset-password-form",
    lastResult:
      fetcher.data?.intent === "resetPassword" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.resetPassword.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.resetPassword.schema,
      });
    },
  });

  fetcher.register("resetPassword", {
    onSuccess: () => {
      setIsCompleted(true);
    },
    onHandlerError: ({ error: err }) => {
      console.error("Reset password failed:", err);
    },
  });

  const isPending = fetcher.isPending("resetPassword");

  if (expired) {
    return (
      <AuthLayout title="リンクの有効期限切れ">
        <div className="text-center">
          <p className="mb-6 text-sm text-destructive">
            パスワードリセットリンクの有効期限が切れています。
          </p>
          <Link
            to="/customer/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            パスワードリセットを再送信
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isCompleted) {
    return (
      <AuthLayout
        title="パスワード再設定完了"
        description="パスワードが正常に変更されました。新しいパスワードでログインしてください。"
      >
        <div className="text-center">
          <Link to="/customer/login">
            <Button>ログインページへ</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワード再設定"
      description="新しいパスワードを入力してください。"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="resetPassword" />
        <input type="hidden" name="token" value={token} />

        <div className="space-y-5">
          <FormField
            label="新しいパスワード"
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
            label="新しいパスワード（確認）"
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
            {isPending ? "設定中..." : "パスワードを再設定"}
          </Button>
        </div>
      </fetcher.Form>
    </AuthLayout>
  );
}
