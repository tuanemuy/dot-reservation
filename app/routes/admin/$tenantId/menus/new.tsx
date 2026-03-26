import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link, redirect } from "react-router";
import { z } from "zod";
import { createMenu } from "@/core/application/menu/createMenu";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/new";

const createMenuSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  category: z.string().optional().default(""),
  description: z.string().optional().default(""),
  duration: z.coerce.number().min(1, "所要時間を入力してください"),
  price: z.coerce.number().min(0, "料金を入力してください"),
});

export const handlers = {
  createMenu: defineHandler({
    schema: createMenuSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        createMenu({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            name: value.name,
            category: value.category || null,
            description: value.description || null,
            duration: value.duration,
            price: value.price,
          },
        }),
      ).match(
        (result) => success({ id: result.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  const result = await createCompositeAction(args, handlers);

  if (result.intent === "createMenu" && result.status === "success") {
    throw redirect(`/admin/${args.params.tenantId}/menus`);
  }

  return result;
}

export default function TenantMenuNewPage({ params }: Route.ComponentProps) {
  const tenantId = params.tenantId;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "create-menu-form",
    lastResult:
      fetcher.data?.intent === "createMenu" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createMenu.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.createMenu.schema });
    },
  });

  const isPending = fetcher.isPending("createMenu");

  return (
    <div className="">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/menus`}
          className="text-sm text-neutral-500 hover:text-neutral-600"
        >
          &larr; メニュー一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-800">
          メニュー登録
        </h1>
      </div>

      <div className="max-w-2xl">
        <fetcher.Form
          method="post"
          {...getFormProps(form)}
          className="rounded-lg border border-neutral-300 bg-white p-6"
        >
          <input type="hidden" name="intent" value="createMenu" />
          <div className="space-y-4">
            <div>
              <label
                htmlFor={fields.name.id}
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                メニュー名
              </label>
              <input
                {...getInputProps(fields.name, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例: カット"
              />
              {fields.name.errors && (
                <p className="mt-1 text-xs text-error">{fields.name.errors}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={fields.category.id}
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                カテゴリー
              </label>
              <input
                {...getInputProps(fields.category, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="例: カット"
              />
            </div>

            <div>
              <label
                htmlFor={fields.description.id}
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                説明文
              </label>
              <textarea
                id={fields.description.id}
                name={fields.description.name}
                rows={3}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="メニューの説明を入力..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={fields.duration.id}
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  所要時間（分）
                </label>
                <input
                  {...getInputProps(fields.duration, { type: "number" })}
                  min={1}
                  className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  placeholder="60"
                />
                {fields.duration.errors && (
                  <p className="mt-1 text-xs text-error">
                    {fields.duration.errors}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={fields.price.id}
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  料金（円）
                </label>
                <input
                  {...getInputProps(fields.price, { type: "number" })}
                  min={0}
                  className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  placeholder="5000"
                />
                {fields.price.errors && (
                  <p className="mt-1 text-xs text-error">
                    {fields.price.errors}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                to={`/admin/${tenantId}/menus`}
                className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium tracking-wide text-white transition-[background,transform] duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? "登録中..." : "メニューを登録"}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
