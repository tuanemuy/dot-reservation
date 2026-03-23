import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect } from "react-router";
import { z } from "zod";
import { listMenus } from "@/core/application/menu/listMenus";
import { getReservation } from "@/core/application/reservation/getReservation";
import { updateReservation } from "@/core/application/reservation/updateReservation";
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
import type { Route } from "./+types/$reservationId.edit";

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantId = params.tenantId;

  const reservationResult = await handleUseCase(() =>
    getReservation({
      container,
      headers: request.headers,
      input: { reservationId: params.reservationId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result,
    () => ({ items: [] }),
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
    reservation: reservationResult,
    menus: menusResult.items,
    staff: staffResult.items,
  };
}

const updateReservationSchema = z.object({
  menuId: z.string().min(1, "メニューを選択してください"),
  staffId: z.string().optional().default(""),
  date: z.string().min(1, "日付を入力してください"),
  time: z.string().min(1, "時刻を入力してください"),
});

export const handlers = {
  updateReservation: defineHandler({
    schema: updateReservationSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        updateReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: args.params.reservationId as string,
            menuId: value.menuId,
            staffProfileId: value.staffId || null,
            date: value.date,
            startTime: value.time,
            note: null,
            modifiedBy: "admin",
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

  if (result.intent === "updateReservation" && result.status === "success") {
    throw redirect(
      `/admin/${args.params.tenantId}/reservations/${args.params.reservationId}`,
    );
  }

  return result;
}

export default function TenantReservationEditPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const tenantId = params.tenantId;
  const { reservation, menus, staff } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  // Find the menuId from the reservation's menuName
  const currentMenu = menus.find((m) => m.name === reservation.menuName);
  // Find the staffId from the reservation's staffName
  const currentStaff = staff.find(
    (s) => s.displayName === reservation.staffName,
  );

  const [form, fields] = useForm({
    id: "update-reservation-form",
    lastResult:
      fetcher.data?.intent === "updateReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateReservation.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    defaultValue: {
      menuId: currentMenu?.id ?? "",
      staffId: currentStaff?.id ?? "",
      date: reservation.date,
      time: reservation.startTime,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateReservation.schema,
      });
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  return (
    <div className="">
      <div className="mb-8">
        <Link
          to={`/admin/${tenantId}/reservations/${reservation.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-600"
        >
          &larr; 予約詳細に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-800">予約変更</h1>
      </div>

      <div className="max-w-2xl">
        <fetcher.Form
          method="post"
          {...getFormProps(form)}
          className="rounded-[var(--radius-lg)] border border-neutral-300 bg-white p-[var(--space-lg)]"
        >
          <input type="hidden" name="intent" value="updateReservation" />
          <div className="space-y-6">
            {/* メニュー選択 */}
            <section>
              <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
                メニュー
              </h2>
              <select
                {...getInputProps(fields.menuId, { type: "text" })}
                className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} ({menu.duration}分 / &yen;
                    {menu.price.toLocaleString()})
                  </option>
                ))}
              </select>
              {fields.menuId.errors && (
                <p className="mt-1 text-[length:var(--text-xs)] text-error">
                  {fields.menuId.errors}
                </p>
              )}
            </section>

            {/* スタッフ選択 */}
            <section>
              <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
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
              <h2 className="mb-[var(--space-md)] font-[var(--font-heading)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] tracking-[var(--tracking-tight)] text-neutral-800">
                日時
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={fields.date.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
                  >
                    日付
                  </label>
                  <input
                    {...getInputProps(fields.date, { type: "date" })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {fields.date.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {fields.date.errors}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={fields.time.id}
                    className="mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-700"
                  >
                    時刻
                  </label>
                  <input
                    {...getInputProps(fields.time, { type: "time" })}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-md)] text-[length:var(--text-base)] text-neutral-800 transition-[border-color] duration-[0.15s] ease-[ease] hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  />
                  {fields.time.errors && (
                    <p className="mt-1 text-[length:var(--text-xs)] text-error">
                      {fields.time.errors}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ボタン */}
            <div className="flex justify-end gap-3 border-t border-neutral-300 pt-4">
              <Link
                to={`/admin/${tenantId}/reservations/${reservation.id}`}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-neutral-300 bg-white px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-[var(--space-lg)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-white transition-[background,transform] duration-[0.15s] ease-[ease] hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? "変更中..." : "予約を変更"}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
