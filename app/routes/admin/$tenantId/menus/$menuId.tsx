import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect } from "react-router";
import { z } from "zod";
import { listMenus } from "@/core/application/menu/listMenus";
import { updateMenu } from "@/core/application/menu/updateMenu";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/$menuId";

export async function loader({ params, request }: Route.LoaderArgs) {
  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: params.tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menu = menusResult.items.find((m) => m.id === params.menuId);
  if (!menu) {
    throw data({ message: "メニューが見つかりません" }, { status: 404 });
  }

  return { menu };
}

const updateMenuSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  category: z.string().optional().default(""),
  description: z.string().optional().default(""),
  duration: z.coerce.number().min(1, "所要時間を入力してください"),
  price: z.coerce.number().min(0, "料金を入力してください"),
});

export const handlers = {
  updateMenu: defineHandler({
    schema: updateMenuSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        updateMenu({
          container,
          headers: args.request.headers,
          input: {
            menuId: args.params.menuId as string,
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

  if (result.intent === "updateMenu" && result.status === "success") {
    throw redirect(`/admin/${args.params.tenantId}/menus`);
  }

  return result;
}

export default function TenantMenuEditPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const tenantId = params.tenantId;
  const { menu } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "update-menu-form",
    lastResult:
      fetcher.data?.intent === "updateMenu" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateMenu.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      name: menu.name,
      category: menu.category ?? "",
      description: menu.description ?? "",
      duration: String(menu.duration),
      price: String(menu.price),
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.updateMenu.schema });
    },
  });

  const isPending = fetcher.isPending("updateMenu");

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
          メニュー編集
        </h1>
      </div>

      <div className="max-w-2xl">
        <fetcher.Form
          method="post"
          {...getFormProps(form)}
          className="rounded-lg border border-neutral-300 bg-white p-6"
        >
          <input type="hidden" name="intent" value="updateMenu" />
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
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
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
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
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
                defaultValue={menu.description ?? ""}
                className="min-h-[88px] w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
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
                {isPending ? "更新中..." : "メニューを更新"}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
