import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { createMemberAccount } from "@/core/application/member/createMemberAccount";
import { authClient } from "@/lib/authClient";
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

const createMemberAccountSchema = z.object({
  authUserId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
});

const handlers = {
  createMemberAccount: defineHandler({
    schema: createMemberAccountSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const result = await handleUseCase(() =>
        createMemberAccount({
          container,
          headers: args.request.headers,
          input: {
            authUserId: value.authUserId,
            name: value.name,
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

export default function AdminRegisterPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [form, fields] = useForm({
    id: "admin-register-form",
    constraint: getZodConstraint(registerSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: registerSchema });
    },
    onSubmit(event) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const parsed = parseWithZod(formData, { schema: registerSchema });
      if (parsed.status !== "success") {
        return;
      }

      setFormError(null);
      setIsSigningUp(true);

      const { name, email, password } = parsed.value;

      authClient.signUp
        .email({
          name,
          email,
          password,
        })
        .then(({ data: signUpData, error: signUpError }) => {
          if (signUpError) {
            if (signUpError.code === "USER_ALREADY_EXISTS") {
              setFormError(
                "このメールアドレスは既に登録されています。ログインしてください。",
              );
            } else {
              setFormError(signUpError.message ?? "登録に失敗しました。");
            }
            setIsSigningUp(false);
            return;
          }

          if (!signUpData?.user) {
            setFormError("登録に失敗しました。");
            setIsSigningUp(false);
            return;
          }

          const memberFormData = new FormData();
          memberFormData.set("intent", "createMemberAccount");
          memberFormData.set("authUserId", signUpData.user.id);
          memberFormData.set("name", name);
          memberFormData.set("email", email);
          fetcher.submit(memberFormData, { method: "post" });
        })
        .catch(() => {
          setFormError("登録に失敗しました。");
          setIsSigningUp(false);
        });
    },
  });

  fetcher.register("createMemberAccount", {
    onSuccess: () => {
      setIsSigningUp(false);
      setIsSubmitted(true);
    },
    onHandlerError: ({ error: err }) => {
      setIsSigningUp(false);
      setFormError(
        err?.[""]?.[0] ?? "メンバーアカウントの作成に失敗しました。",
      );
    },
  });

  const isPending = isSigningUp || fetcher.isPending("createMemberAccount");

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
      <form method="post" {...getFormProps(form)}>
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

          {formError && (
            <div className="text-xs text-destructive">
              <p>{formError}</p>
              {formError.includes("既に登録されています") && (
                <Link
                  to="/admin/login"
                  className="mt-1 inline-block font-medium text-primary hover:underline"
                >
                  ログインページへ
                </Link>
              )}
            </div>
          )}

          {form.errors && (
            <p className="text-xs text-destructive">{form.errors}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登録中..." : "アカウントを登録"}
          </Button>
        </div>
      </form>

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
