import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";
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
import type { Route } from "./+types/setup";

const setupSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください"),
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
        createCustomer({
          container,
          headers: args.request.headers,
          input: {
            authUserId: session.user.id,
            displayName: value.displayName,
            email: session.user.email,
          },
        }),
      ).match(
        (r) => success({ displayName: r.displayName }),
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
    throw redirect("/customer/login");
  }

  return data({ userName: session.user.name, email: session.user.email });
}

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function CustomerSetupPage({
  loaderData,
}: Route.ComponentProps) {
  const { userName, email } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "customer-setup-form",
    lastResult: fetcher.data?.intent === "setup" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.setup.schema),
    defaultValue: {
      displayName: userName,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.setup.schema });
    },
  });

  fetcher.register("setup", {
    onSuccess: () => {
      window.location.href = "/mypage/reservations";
    },
  });

  const isPending = fetcher.isPending("setup");

  return (
    <AuthLayout
      title="プロフィール作成"
      description="サービスを利用するために、顧客プロフィールを作成してください。"
    >
      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="setup" />

        <FormField label="メールアドレス" htmlFor="setup-email-display">
          <Input id="setup-email-display" type="email" value={email} disabled />
          <p className="mt-1 text-xs text-neutral-500">
            認証アカウントのメールアドレスが使用されます
          </p>
        </FormField>

        <FormField
          label="表示名"
          htmlFor={fields.displayName.id}
          error={fields.displayName.errors}
        >
          <Input
            {...getInputProps(fields.displayName, { type: "text" })}
            placeholder="山田 太郎"
            error={fields.displayName.errors?.[0]}
          />
        </FormField>

        {form.errors && (
          <p className="text-sm text-error mb-6">{form.errors}</p>
        )}

        <Button type="submit" disabled={isPending} className="mt-8 w-full">
          {isPending ? "作成中..." : "プロフィールを作成"}
        </Button>
      </fetcher.Form>
    </AuthLayout>
  );
}
