import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect } from "react-router";
import { z } from "zod";
import { listMenus } from "@/core/application/menu/listMenus";
import { createProxyReservation } from "@/core/application/reservation/createProxyReservation";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const staffResult = await handleUseCase(() =>
    listStaffProfiles({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
  );

  return {
    menus: menusResult.items,
    staff: staffResult.items,
  };
}

const createReservationSchema = z.object({
  customerName: z.string().min(1, "顧客名を入力してください"),
  customerPhone: z.string().optional().default(""),
  customerEmail: z.string().optional().default(""),
  menuId: z.string().min(1, "メニューを選択してください"),
  staffId: z.string().optional().default(""),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
  notes: z.string().optional().default(""),
});

export const handlers = {
  createReservation: defineHandler({
    schema: createReservationSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        createProxyReservation({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            customerId: null,
            customerName: value.customerName,
            customerEmail: value.customerEmail || null,
            customerPhoneNumber: value.customerPhone || null,
            menuId: value.menuId,
            staffProfileId: value.staffId || "",
            date: value.date,
            startTime: value.time,
            note: value.notes || null,
            createdBy: "admin",
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

  if (result.intent === "createReservation" && result.status === "success") {
    throw redirect(`/admin/${args.params.tenantId}/reservations`);
  }

  return result;
}

export default function TenantReservationNewPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const tenantId = params.tenantId;
  const { menus, staff } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "create-reservation-form",
    lastResult:
      fetcher.data?.intent === "createReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createReservation.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.createReservation.schema,
      });
    },
  });

  const isPending = fetcher.isPending("createReservation");

  return (
    <div className="">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/reservations`}
          className="text-sm text-neutral-500 hover:text-neutral-600"
        >
          &larr; 予約一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-800">
          代理予約登録
        </h1>
      </div>

      <div className="max-w-2xl">
        <fetcher.Form
          method="post"
          {...getFormProps(form)}
          className="rounded-lg border border-neutral-300 bg-white p-6"
        >
          <input type="hidden" name="intent" value="createReservation" />
          <div className="space-y-6">
            {/* 顧客情報 */}
            <section>
              <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
                顧客情報
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor={fields.customerName.id}
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    顧客名
                  </label>
                  <input
                    {...getInputProps(fields.customerName, { type: "text" })}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                    placeholder="山田 太郎"
                  />
                  {fields.customerName.errors && (
                    <p className="mt-1 text-xs text-error">
                      {fields.customerName.errors}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={fields.customerPhone.id}
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    電話番号
                  </label>
                  <input
                    {...getInputProps(fields.customerPhone, { type: "tel" })}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                    placeholder="090-1234-5678"
                  />
                </div>
                <div>
                  <label
                    htmlFor={fields.customerEmail.id}
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    メールアドレス
                  </label>
                  <input
                    {...getInputProps(fields.customerEmail, { type: "email" })}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </section>

            {/* メニュー選択 */}
            <section>
              <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
                メニュー
              </h2>
              <select
                {...getInputProps(fields.menuId, { type: "text" })}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">メニューを選択</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} ({menu.duration}分 / &yen;
                    {menu.price.toLocaleString()})
                  </option>
                ))}
              </select>
              {fields.menuId.errors && (
                <p className="mt-1 text-xs text-error">
                  {fields.menuId.errors}
                </p>
              )}
            </section>

            {/* スタッフ選択 */}
            <section>
              <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
                担当スタッフ
              </h2>
              <select
                {...getInputProps(fields.staffId, { type: "text" })}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">指名なし</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </section>

            {/* 日時選択 */}
            <section>
              <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
                日時
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={fields.date.id}
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    日付
                  </label>
                  <input
                    {...getInputProps(fields.date, { type: "date" })}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {fields.date.errors && (
                    <p className="mt-1 text-xs text-error">
                      {fields.date.errors}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={fields.time.id}
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    時刻
                  </label>
                  <input
                    {...getInputProps(fields.time, { type: "time" })}
                    className="h-11 w-full rounded-md border border-neutral-300 bg-white px-4 text-base text-neutral-800 transition-[border-color] duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {fields.time.errors && (
                    <p className="mt-1 text-xs text-error">
                      {fields.time.errors}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 備考 */}
            <section>
              <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-neutral-800">
                備考
              </h2>
              <textarea
                id={fields.notes.id}
                name={fields.notes.name}
                rows={3}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="備考を入力..."
              />
            </section>

            {/* ボタン */}
            <div className="flex justify-end gap-3 border-t border-neutral-300 pt-4">
              <Link
                to={`/admin/${tenantId}/reservations`}
                className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium tracking-wide text-white transition-[background,transform] duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? "登録中..." : "予約を登録"}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
