import { getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AlertError } from "@/components/ui/AlertError";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { createCustomer } from "@/core/application/customer/createCustomer";
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

const createCustomerSchema = z.object({
  authUserId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email(),
});

const handlers = {
  createCustomer: defineHandler({
    schema: createCustomerSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const result = await handleUseCase(() =>
        createCustomer({
          container,
          headers: args.request.headers,
          input: {
            authUserId: value.authUserId,
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
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [form, fields] = useForm({
    id: "register-form",
    constraint: getZodConstraint(registerSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: registerSchema });
    },
  });

  fetcher.register("createCustomer", {
    onSuccess: () => {
      setIsSubmitted(true);
      setIsPending(false);
    },
    onHandlerError: () => {
      setFormError("アカウントの作成に失敗しました。もう一度お試しください。");
      setIsPending(false);
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const submission = parseWithZod(formData, { schema: registerSchema });

    if (submission.status !== "success") {
      return;
    }

    const { displayName, email, password } = submission.value;

    setIsPending(true);

    const { data: signUpData, error: signUpError } =
      await authClient.signUp.email({
        name: displayName,
        email,
        password,
        callbackURL: "/customer/verify-email",
      });

    if (signUpError) {
      if (signUpError.code === "USER_ALREADY_EXISTS") {
        setFormError(
          "このメールアドレスは既に登録されています。ログインしてください。",
        );
      } else {
        setFormError(
          signUpError.message ?? "登録に失敗しました。もう一度お試しください。",
        );
      }
      setIsPending(false);
      return;
    }

    const authUserId = signUpData?.user?.id;

    if (authUserId) {
      const createCustomerFormData = new FormData();
      createCustomerFormData.set("intent", "createCustomer");
      createCustomerFormData.set("authUserId", authUserId);
      createCustomerFormData.set("displayName", displayName);
      createCustomerFormData.set("email", email);
      fetcher.submit(createCustomerFormData, { method: "post" });
    } else {
      setIsSubmitted(true);
      setIsPending(false);
    }
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        title="確認メールを送信しました"
        description="メールに記載されたリンクをクリックして、アカウントを有効化してください。"
      >
        <p className="text-center text-sm text-neutral-600 mb-6">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <AuthLink to="/customer/login">ログインページへ</AuthLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="新規会員登録">
      <form id={form.id} onSubmit={handleSubmit} noValidate>
        <FormField
          label="表示名"
          htmlFor={fields.displayName.id}
          error={fields.displayName.errors}
        >
          <Input
            {...getInputProps(fields.displayName, { type: "text" })}
            placeholder="例: 田中 太郎"
            autoComplete="name"
            error={fields.displayName.errors?.[0]}
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
            placeholder="8文字以上"
            autoComplete="new-password"
            error={fields.password.errors?.[0]}
          />
        </FormField>

        <FormField
          label="パスワード（確認）"
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
            <AlertError error={formError} />
            {formError.includes("既に登録されています") && (
              <div className="text-center mt-2">
                <AuthLink to="/customer/login">ログインページへ</AuthLink>
              </div>
            )}
          </div>
        )}

        {form.errors && (
          <p className="text-sm text-error mb-6">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "登録中..." : "登録する"}
        </Button>
      </form>

      <AuthLink to="/customer/login" className="mt-6">
        アカウントをお持ちの方はこちら
      </AuthLink>
    </AuthLayout>
  );
}

function AuthLink({
  to,
  children,
  className: extraClassName,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`block text-center font-medium text-sm text-primary no-underline ${extraClassName ?? ""}`}
    >
      {children}
    </Link>
  );
}
