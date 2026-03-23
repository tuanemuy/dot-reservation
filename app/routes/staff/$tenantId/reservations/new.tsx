import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect, useParams } from "react-router";
import { z } from "zod";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import { createProxyReservation } from "@/core/application/reservation/createProxyReservation";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
import {
  createCompositeAction,
  defineHandler,
  error,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/new";

const createReservationSchema = z.object({
  tenantId: z.string().min(1),
  staffProfileId: z.string().min(1),
  customerName: z.string().min(1, "顧客名を入力してください"),
  customerPhone: z.string().optional(),
  menuId: z.string().min(1, "メニューを選択してください"),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "時間を選択してください"),
  note: z.string().optional(),
});

const handlers = {
  createReservation: defineHandler({
    schema: createReservationSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      const result = await handleUseCase(() =>
        createProxyReservation({
          container,
          headers: args.request.headers,
          input: {
            tenantId: value.tenantId,
            customerId: null,
            customerName: value.customerName,
            customerEmail: null,
            customerPhoneNumber: value.customerPhone ?? null,
            menuId: value.menuId,
            staffProfileId: value.staffProfileId,
            date: value.date,
            startTime: value.startTime,
            note: value.note ?? null,
            createdBy: "staff",
          },
        }),
      ).match(
        (result) => result,
        (_e) => null,
      );

      if (!result) {
        return error({
          "": [
            "予約の登録に失敗しました。時間枠が利用できない可能性があります。",
          ],
        });
      }

      throw redirect(`/staff/${value.tenantId}/reservations/${result.id}`);
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const tenantId = params.tenantId;

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/admin/login");
  }

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  const currentMember = members.find((m) => m.tenantId === tenantId);
  if (!currentMember) {
    throw redirect("/admin/tenants");
  }

  const myProfile = await handleUseCase(() =>
    getStaffProfileByMemberId({
      container,
      headers: request.headers,
      input: { memberId: currentMember.id },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const staffProfileId = myProfile.id;

  const allMenusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId },
    }),
  ).match(
    (result) => result.items,
    () => [] as MenuDetail[],
  );

  const assignedMenuIds = new Set(myProfile.assignedMenus.map((m) => m.id));

  const menus = allMenusResult
    .filter((m) => assignedMenuIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      duration: m.duration,
      price: m.price,
    }));

  return {
    menus,
    staffProfileId,
    tenantId,
  };
}

export default function StaffNewReservationPage({
  loaderData,
}: Route.ComponentProps) {
  const { menus, staffProfileId, tenantId } = loaderData;
  const { tenantId: tenantIdParam } = useParams();
  const fetcher = useCompositeAction<typeof handlers>();

  const [reservationForm, reservationFields] = useForm({
    id: "new-reservation-form",
    defaultValue: {
      tenantId,
      staffProfileId,
      customerName: "",
      customerPhone: "",
      menuId: "",
      date: "",
      startTime: "",
      note: "",
    },
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

  fetcher.register("createReservation", {
    onSuccess: () => {
      // Will redirect
    },
    onHandlerError: () => {
      // Error displayed via form
    },
  });

  const isPending = fetcher.isPending("createReservation");

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link
          to={`/staff/${tenantIdParam}/reservations`}
          className="font-medium text-text-muted no-underline transition-colors duration-150 hover:text-primary"
        >
          予約管理
        </Link>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text">代理予約登録</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          代理予約登録
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          お客様に代わって予約を登録します
        </p>
      </div>

      <fetcher.Form method="post" {...getFormProps(reservationForm)}>
        <input type="hidden" name="intent" value="createReservation" />
        <input type="hidden" name="tenantId" value={tenantId} />
        <input type="hidden" name="staffProfileId" value={staffProfileId} />

        {/* Customer Info */}
        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            顧客情報
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={reservationFields.customerName.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                お名前
              </label>
              <input
                {...getInputProps(reservationFields.customerName, {
                  type: "text",
                })}
                placeholder="例: 鈴木 花子"
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
              {reservationFields.customerName.errors && (
                <p className="mt-1 text-xs text-error">
                  {reservationFields.customerName.errors[0]}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor={reservationFields.customerPhone.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                電話番号
              </label>
              <input
                {...getInputProps(reservationFields.customerPhone, {
                  type: "tel",
                })}
                placeholder="例: 090-1234-5678"
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
            </div>
          </div>
        </div>

        {/* Menu Selection */}
        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            メニュー選択
          </h2>
          {menus.length === 0 ? (
            <p className="text-sm text-text-muted">
              担当メニューがありません。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {menus.map((menu) => (
                <label
                  key={menu.id}
                  className="flex cursor-pointer items-center gap-4 rounded-[10px] border border-border p-4 transition-all duration-150 hover:border-neutral-400 hover:bg-neutral-50"
                >
                  <input
                    type="radio"
                    name="menuId"
                    value={menu.id}
                    className="h-[18px] w-[18px] shrink-0 accent-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text">
                      {menu.name}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {menu.duration}分
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-accent-dark">
                    {menu.price.toLocaleString()}円
                  </span>
                </label>
              ))}
            </div>
          )}
          {reservationFields.menuId.errors && (
            <p className="mt-2 text-xs text-error">
              {reservationFields.menuId.errors[0]}
            </p>
          )}
        </div>

        {/* Date & Time */}
        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            日時選択
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={reservationFields.date.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                日付
              </label>
              <input
                {...getInputProps(reservationFields.date, { type: "date" })}
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
              {reservationFields.date.errors && (
                <p className="mt-1 text-xs text-error">
                  {reservationFields.date.errors[0]}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor={reservationFields.startTime.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                開始時間
              </label>
              <input
                {...getInputProps(reservationFields.startTime, {
                  type: "time",
                })}
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
              {reservationFields.startTime.errors && (
                <p className="mt-1 text-xs text-error">
                  {reservationFields.startTime.errors[0]}
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            自分のシフト時間内の空き枠のみ選択できます
          </p>
        </div>

        {/* Notes */}
        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            備考
          </h2>
          <textarea
            id={reservationFields.note.id}
            name={reservationFields.note.name}
            rows={3}
            placeholder="予約に関するメモや顧客からの要望を入力してください"
            className="w-full resize-y rounded-[10px] border border-border bg-white p-4 font-body text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
          />
        </div>

        {reservationForm.errors && (
          <p className="mb-4 text-xs text-error">{reservationForm.errors}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-8 text-sm font-medium tracking-wide text-white transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60"
          >
            {isPending ? "登録中..." : "代理予約を登録する"}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}
