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
import { createProxyReservation } from "@/core/application/reservation/createProxyReservation";
import { getStaffProfile } from "@/core/application/staff/getStaffProfile";
import { listStaffProfiles } from "@/core/application/staff/listStaffProfiles";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
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
        (e) => null,
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

  // Get staff profiles to find current staff and their assigned menus
  const profilesResult = await handleUseCase(() =>
    listStaffProfiles({
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

  const firstProfile = profilesResult.items[0];
  const staffProfileId = firstProfile?.id ?? "";

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

  // Get assigned menus for this staff
  let assignedMenuIds = new Set<string>();
  if (firstProfile) {
    const staffResult = await handleUseCase(() =>
      getStaffProfile({
        container,
        headers: request.headers,
        input: { staffProfileId: firstProfile.id },
      }),
    ).match(
      (result) => result,
      () => null,
    );

    if (staffResult) {
      assignedMenuIds = new Set(staffResult.assignedMenus.map((m) => m.id));
    }
  }

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
    onHandlerError: ({ error: err }) => {
      console.error("Reservation creation failed:", err);
    },
  });

  const isPending = fetcher.isPending("createReservation");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text">代理予約登録</h1>

      <Card>
        <CardBody>
          <fetcher.Form method="post" {...getFormProps(reservationForm)}>
            <input type="hidden" name="intent" value="createReservation" />
            <input type="hidden" name="tenantId" value={tenantId} />
            <input type="hidden" name="staffProfileId" value={staffProfileId} />

            <div className="space-y-6">
              {/* 顧客情報 */}
              <fieldset className="space-y-4">
                <legend className="text-base font-semibold text-text">
                  顧客情報
                </legend>

                <FormField
                  label="顧客名"
                  htmlFor={reservationFields.customerName.id}
                  error={reservationFields.customerName.errors}
                  required
                >
                  <Input
                    {...getInputProps(reservationFields.customerName, {
                      type: "text",
                    })}
                    error={reservationFields.customerName.errors?.[0]}
                  />
                </FormField>

                <FormField
                  label="電話番号"
                  htmlFor={reservationFields.customerPhone.id}
                >
                  <Input
                    {...getInputProps(reservationFields.customerPhone, {
                      type: "tel",
                    })}
                    placeholder="090-1234-5678"
                  />
                </FormField>
              </fieldset>

              {/* メニュー選択 */}
              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-text">
                  メニュー選択
                </legend>
                <p className="text-xs text-text-muted">
                  自分の担当メニューのみ選択可能です。
                </p>
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

                {reservationFields.menuId.errors && (
                  <p className="text-xs text-destructive">
                    {reservationFields.menuId.errors[0]}
                  </p>
                )}
              </fieldset>

              {/* 日時選択 */}
              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-text">
                  日時選択
                </legend>
                <p className="text-xs text-text-muted">
                  自分のシフト内の空き時間から選択してください。
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="日付"
                    htmlFor={reservationFields.date.id}
                    error={reservationFields.date.errors}
                    required
                  >
                    <Input
                      {...getInputProps(reservationFields.date, {
                        type: "date",
                      })}
                      error={reservationFields.date.errors?.[0]}
                    />
                  </FormField>
                  <FormField
                    label="時間"
                    htmlFor={reservationFields.startTime.id}
                    error={reservationFields.startTime.errors}
                    required
                  >
                    <Input
                      {...getInputProps(reservationFields.startTime, {
                        type: "time",
                      })}
                      error={reservationFields.startTime.errors?.[0]}
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* 備考 */}
              <FormField label="備考" htmlFor={reservationFields.note.id}>
                <textarea
                  id={reservationFields.note.id}
                  name={reservationFields.note.name}
                  rows={3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </FormField>

              {reservationForm.errors && (
                <p className="text-xs text-destructive">
                  {reservationForm.errors}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Link to={`/staff/${tenantIdParam}/reservations`}>
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "登録中..." : "登録する"}
                </Button>
              </div>
            </div>
          </fetcher.Form>
        </CardBody>
      </Card>
    </div>
  );
}
