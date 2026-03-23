import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect, useParams } from "react-router";
import { z } from "zod";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import { getReservation } from "@/core/application/reservation/getReservation";
import { updateReservation } from "@/core/application/reservation/updateReservation";
import { getStaffProfileByMemberId } from "@/core/application/staff/getStaffProfileByMemberId";
import {
  createCompositeAction,
  defineHandler,
  error,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/$reservationId.edit";

const updateSchema = z.object({
  reservationId: z.string().min(1),
  menuId: z.string().min(1, "メニューを選択してください"),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "時間を選択してください"),
  note: z.string().optional(),
});

const handlers = {
  updateReservation: defineHandler({
    schema: updateSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = args.params.tenantId as string;

      const result = await handleUseCase(() =>
        updateReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: value.reservationId,
            menuId: value.menuId,
            staffProfileId: null,
            date: value.date,
            startTime: value.startTime,
            note: value.note ?? null,
            modifiedBy: "staff",
          },
        }),
      ).match(
        (result) => result,
        (_e) => null,
      );

      if (!result) {
        return error({ "": ["予約の変更に失敗しました"] });
      }

      throw redirect(`/staff/${tenantId}/reservations/${value.reservationId}`);
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
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
    reservation: {
      id: reservationResult.id,
      customerName: reservationResult.customerName,
      menuName: reservationResult.menuName,
      date: reservationResult.date,
      startTime: reservationResult.startTime,
      endTime: reservationResult.endTime,
      note: reservationResult.note ?? "",
      menuDuration: reservationResult.menuDuration,
      menuPrice: reservationResult.menuPrice,
      staffName: myProfile.displayName,
    },
    menus,
  };
}

export default function StaffReservationEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation, menus } = loaderData;
  const { tenantId } = useParams();
  const fetcher = useCompositeAction<typeof handlers>();

  const [editForm, editFields] = useForm({
    id: "edit-reservation-form",
    defaultValue: {
      reservationId: reservation.id,
      menuId: "",
      date: reservation.date,
      startTime: reservation.startTime,
      note: reservation.note,
    },
    lastResult:
      fetcher.data?.intent === "updateReservation" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateReservation.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateReservation.schema,
      });
    },
  });

  fetcher.register("updateReservation", {
    onSuccess: () => {
      // Will redirect
    },
    onHandlerError: () => {
      // Error displayed via form
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link
          to={`/staff/${tenantId}/reservations`}
          className="font-medium text-text-muted no-underline transition-colors duration-150 hover:text-primary"
        >
          予約管理
        </Link>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text">予約変更</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-neutral-900">
          予約変更
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {reservation.customerName} 様の予約を変更します
        </p>
      </div>

      {/* Change Form */}
      <fetcher.Form method="post" {...getFormProps(editForm)}>
        <input type="hidden" name="intent" value="updateReservation" />
        <input type="hidden" name="reservationId" value={reservation.id} />

        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            変更内容
          </h2>

          {/* Menu Selection */}
          <div className="mb-6">
            <span className="mb-2 block text-sm font-medium text-text">
              メニュー
            </span>
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
            {editFields.menuId.errors && (
              <p className="mt-1 text-xs text-error">
                {editFields.menuId.errors[0]}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={editFields.date.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                日付
              </label>
              <input
                {...getInputProps(editFields.date, { type: "date" })}
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
              {editFields.date.errors && (
                <p className="mt-1 text-xs text-error">
                  {editFields.date.errors[0]}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor={editFields.startTime.id}
                className="mb-2 block text-sm font-medium text-text"
              >
                開始時間
              </label>
              <input
                {...getInputProps(editFields.startTime, { type: "time" })}
                className="h-11 w-full rounded-[10px] border border-border bg-white px-4 font-body text-base text-text transition-colors duration-150 hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
              />
              {editFields.startTime.errors && (
                <p className="mt-1 text-xs text-error">
                  {editFields.startTime.errors[0]}
                </p>
              )}
            </div>
          </div>

          {/* Staff (disabled) */}
          <div className="mb-6">
            <span className="mb-2 block text-sm font-medium text-text">
              担当スタッフ
            </span>
            <input
              type="text"
              value={reservation.staffName}
              disabled
              className="h-11 w-full rounded-[10px] border border-border bg-surface-secondary px-4 font-body text-base text-text opacity-70"
            />
            <div className="mt-2 flex items-center gap-1.5">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                className="h-4 w-4 text-info"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
              <span className="text-xs text-text-muted">
                担当スタッフは変更できません
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8 max-w-[640px] rounded-[14px] border border-border bg-white p-8">
          <h2 className="mb-6 border-b border-surface-secondary pb-2 font-heading text-lg font-semibold tracking-tight text-text">
            備考
          </h2>
          <textarea
            id={editFields.note.id}
            name={editFields.note.name}
            rows={3}
            defaultValue={reservation.note}
            placeholder="予約に関するメモを入力してください"
            className="w-full resize-y rounded-[10px] border border-border bg-white p-4 font-body text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-neutral-400 focus:border-primary focus:outline-2 focus:outline-primary"
          />
        </div>

        {editForm.errors && (
          <p className="mb-4 text-xs text-error">{editForm.errors}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to={`/staff/${tenantId}/reservations/${reservation.id}`}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border bg-white px-8 text-sm font-medium text-text no-underline transition-colors duration-150 hover:bg-surface-secondary"
          >
            戻る
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-none bg-primary px-8 text-sm font-medium tracking-wide text-white transition-colors duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-60"
          >
            {isPending ? "変更中..." : "変更を確定する"}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}
