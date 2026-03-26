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
          callbackURL: "/admin/verify-email",
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
        badge="管理画面"
        title="確認メールを送信しました"
        description="ご入力いただいたメールアドレスに確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。"
      >
        <p className="mb-6 text-center text-sm text-neutral-600">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <Link
          to="/admin/login"
          className="block text-center text-sm font-medium text-primary no-underline"
        >
          ログインページへ
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout badge="管理画面" title="管理画面アカウント登録">
      <form method="post" {...getFormProps(form)}>
        <FormField
          label="氏名"
          htmlFor={fields.name.id}
          error={fields.name.errors}
        >
          <Input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="山田 太郎"
            autoComplete="name"
            error={fields.name.errors?.[0]}
          />
        </FormField>

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
            placeholder="8文字以上で入力"
            autoComplete="new-password"
            error={fields.password.errors?.[0]}
          />
        </FormField>

        <FormField
          label="パスワード確認"
          htmlFor={fields.passwordConfirmation.id}
          error={fields.passwordConfirmation.errors}
        >
          <Input
            {...getInputProps(fields.passwordConfirmation, {
              type: "password",
            })}
            placeholder="パスワードを再入力"
            autoComplete="new-password"
            error={fields.passwordConfirmation.errors?.[0]}
          />
        </FormField>

        {formError && (
          <div className="mb-6">
            <div
              className="flex items-center gap-2 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 text-sm text-error"
              role="alert"
            >
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              {formError}
            </div>
            {formError.includes("既に登録されています") && (
              <div className="mt-2 text-center">
                <Link
                  to="/admin/login"
                  className="text-sm font-medium text-primary no-underline"
                >
                  ログインページへ
                </Link>
              </div>
            )}
          </div>
        )}

        {form.errors && (
          <p className="mb-6 text-sm text-error">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "登録中..." : "アカウントを作成"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Link
          to="/admin/login"
          className="text-sm font-medium text-primary no-underline"
        >
          既にアカウントをお持ちの方
        </Link>
      </div>
    </AuthLayout>
  );
}
