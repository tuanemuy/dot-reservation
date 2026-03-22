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
            tenantId: args.params.tenantId!,
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
    <div className="p-8">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/menus`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; メニュー一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">メニュー登録</h1>
      </div>

      <div className="max-w-2xl">
        <fetcher.Form
          method="post"
          {...getFormProps(form)}
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <input type="hidden" name="intent" value="createMenu" />
          <div className="space-y-4">
            <div>
              <label
                htmlFor={fields.name.id}
                className="block text-sm font-medium text-gray-700"
              >
                メニュー名
              </label>
              <input
                {...getInputProps(fields.name, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: カット"
              />
              {fields.name.errors && (
                <p className="mt-1 text-sm text-red-600">
                  {fields.name.errors}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={fields.category.id}
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリー
              </label>
              <input
                {...getInputProps(fields.category, { type: "text" })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例: カット"
              />
            </div>

            <div>
              <label
                htmlFor={fields.description.id}
                className="block text-sm font-medium text-gray-700"
              >
                説明文
              </label>
              <textarea
                id={fields.description.id}
                name={fields.description.name}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="メニューの説明を入力..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={fields.duration.id}
                  className="block text-sm font-medium text-gray-700"
                >
                  所要時間（分）
                </label>
                <input
                  {...getInputProps(fields.duration, { type: "number" })}
                  min={1}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="60"
                />
                {fields.duration.errors && (
                  <p className="mt-1 text-sm text-red-600">
                    {fields.duration.errors}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={fields.price.id}
                  className="block text-sm font-medium text-gray-700"
                >
                  料金（円）
                </label>
                <input
                  {...getInputProps(fields.price, { type: "number" })}
                  min={0}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="5000"
                />
                {fields.price.errors && (
                  <p className="mt-1 text-sm text-red-600">
                    {fields.price.errors}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                to={`/admin/${tenantId}/menus`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
