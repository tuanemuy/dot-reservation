import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { createMemberAccount } from "@/core/application/member/createMemberAccount";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/setup";

const setupSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
});

const handlers = {
  setup: defineHandler({
    schema: setupSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) {
        return error({
          "": ["認証情報が無効です。再度ログインしてください。"],
        });
      }

      const result = await handleUseCase(() =>
        createMemberAccount({
          container,
          headers: args.request.headers,
          input: {
            authUserId: session.user.id,
            name: value.name,
            email: session.user.email,
          },
        }),
      ).match(
        (r) => success({ name: r.name }),
        (e) => error({ "": [e.message] }),
      );

      return result;
    },
  }),
};

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  return data({ userName: session.user.name, email: session.user.email });
}

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function AdminSetupPage({ loaderData }: Route.ComponentProps) {
  const { userName, email } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "admin-setup-form",
    lastResult: fetcher.data?.intent === "setup" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.setup.schema),
    defaultValue: {
      name: userName,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.setup.schema });
    },
  });

  fetcher.register("setup", {
    onSuccess: () => {
      window.location.href = "/admin/tenants";
    },
  });

  const isPending = fetcher.isPending("setup");

  return (
    <AuthLayout
      badge="管理画面"
      title="プロフィール作成"
      description="管理画面を利用するために、メンバーアカウントを作成してください。"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="setup" />

        <FormField label="メールアドレス" htmlFor="setup-email-display">
          <Input id="setup-email-display" type="email" value={email} disabled />
          <p
            style={{
              marginTop: "var(--space-xs)",
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-500)",
            }}
          >
            認証アカウントのメールアドレスが使用されます
          </p>
        </FormField>

        <FormField
          label="氏名"
          htmlFor={fields.name.id}
          error={fields.name.errors}
        >
          <Input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="山田 太郎"
            error={fields.name.errors?.[0]}
          />
        </FormField>

        {form.errors && (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-error)",
              marginBottom: "var(--space-lg)",
            }}
          >
            {form.errors}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ marginTop: "var(--space-xl)" }}
        >
          {isPending ? "作成中..." : "メンバーアカウントを作成"}
        </Button>
      </fetcher.Form>
    </AuthLayout>
  );
}
