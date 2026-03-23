import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect, useParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
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
            staffProfileId: null, // Staff cannot change staff assignment
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

  // Get reservation
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

  // Get authenticated staff profile
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

  // Get all menus for the tenant
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

  // Filter to only assigned menus
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
      menuName: reservationResult.menuName,
      date: reservationResult.date,
      startTime: reservationResult.startTime,
      endTime: reservationResult.endTime,
      note: reservationResult.note ?? "",
      menuDuration: reservationResult.menuDuration,
      menuPrice: reservationResult.menuPrice,
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
    onHandlerError: ({ error: err }) => {
      console.error("Reservation update failed:", err);
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">予約変更</h1>

      <Card>
        <CardBody>
          <fetcher.Form method="post" {...getFormProps(editForm)}>
            <input type="hidden" name="intent" value="updateReservation" />
            <input type="hidden" name="reservationId" value={reservation.id} />

            <div className="space-y-6">
              {/* メニュー選択 */}
              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-text">
                  メニュー変更
                </legend>
                <p className="text-xs text-text-muted">
                  担当メニュー内でのみ変更できます。スタッフは変更できません。
                </p>

                {/* 現在のメニュー表示 */}
                <div className="rounded-md bg-surface-secondary p-3">
                  <p className="text-xs text-text-muted">現在のメニュー</p>
                  <p className="text-sm font-medium text-text">
                    {reservation.menuName} ({reservation.menuDuration}分 / &yen;
                    {reservation.menuPrice.toLocaleString()})
                  </p>
                </div>

                {menus.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    担当メニューがありません。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {menus.map((menu) => (
                      <label
                        key={menu.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-surface-secondary"
                      >
                        <input
                          type="radio"
                          name="menuId"
                          value={menu.id}
                          className="text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text">
                            {menu.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {menu.duration}分 / &yen;
                            {menu.price.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {editFields.menuId.errors && (
                  <p className="text-xs text-destructive">
                    {editFields.menuId.errors[0]}
                  </p>
                )}
              </fieldset>

              {/* 日時選択 */}
              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-text">
                  日時変更
                </legend>

                {/* 現在の日時表示 */}
                <div className="rounded-md bg-surface-secondary p-3">
                  <p className="text-xs text-text-muted">現在の日時</p>
                  <p className="text-sm font-medium text-text">
                    {reservation.date} {reservation.startTime} -{" "}
                    {reservation.endTime}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="日付"
                    htmlFor={editFields.date.id}
                    error={editFields.date.errors}
                    required
                  >
                    <Input
                      {...getInputProps(editFields.date, { type: "date" })}
                      error={editFields.date.errors?.[0]}
                    />
                  </FormField>
                  <FormField
                    label="時間"
                    htmlFor={editFields.startTime.id}
                    error={editFields.startTime.errors}
                    required
                  >
                    <Input
                      {...getInputProps(editFields.startTime, {
                        type: "time",
                      })}
                      error={editFields.startTime.errors?.[0]}
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* 備考 */}
              <FormField label="備考" htmlFor={editFields.note.id}>
                <textarea
                  id={editFields.note.id}
                  name={editFields.note.name}
                  rows={3}
                  defaultValue={reservation.note}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </FormField>

              {editForm.errors && (
                <p className="text-xs text-destructive">{editForm.errors}</p>
              )}

              <div className="flex justify-end gap-3">
                <Link to={`/staff/${tenantId}/reservations/${reservation.id}`}>
                  <Button type="button" variant="outline">
                    戻る
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "変更中..." : "変更を確定"}
                </Button>
              </div>
            </div>
          </fetcher.Form>
        </CardBody>
      </Card>
    </div>
  );
}
