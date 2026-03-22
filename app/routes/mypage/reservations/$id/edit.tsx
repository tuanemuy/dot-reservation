import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCallback, useEffect, useState } from "react";
import { data, Link, useFetcher, useNavigate } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import type { MenuDetail } from "@/core/application/menu/listMenus";
import { listMenus } from "@/core/application/menu/listMenus";
import type { AvailableSlot } from "@/core/application/reservation/getAvailableSlots";
import { getAvailableSlots } from "@/core/application/reservation/getAvailableSlots";
import { getReservation } from "@/core/application/reservation/getReservation";
import { updateReservation } from "@/core/application/reservation/updateReservation";
import type { StaffProfileSummary } from "@/core/application/staff/listStaffProfiles";
import { listStaffsByMenu } from "@/core/application/staff/listStaffsByMenu";
import { getTenant } from "@/core/application/tenant/getTenant";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/edit";

const updateReservationSchema = z.object({
  reservationId: z.string().min(1),
  menuId: z.string().min(1, "メニューを選択してください"),
  staffProfileId: z.string().optional(),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "開始時刻を選択してください"),
  note: z.string().optional(),
});

const handlers = {
  updateReservation: defineHandler({
    schema: updateReservationSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateReservation({
          container,
          headers: args.request.headers,
          input: {
            reservationId: value.reservationId,
            menuId: value.menuId,
            staffProfileId: value.staffProfileId || null,
            date: value.date,
            startTime: value.startTime,
            note: value.note || null,
            modifiedBy: "customer",
          },
        }),
      ).match(
        (r) => success({ id: r.id }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  loadStaff: defineHandler({
    handler: async (formData, _args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = formData.get("tenantId") as string;
      const menuId = formData.get("menuId") as string;

      const result = await handleUseCase(() =>
        listStaffsByMenu({
          container,
          headers: _args.request.headers,
          input: { tenantId, menuId },
        }),
      ).match(
        (r) => r,
        () => ({ items: [] as StaffProfileSummary[] }),
      );

      return success({ staff: result.items });
    },
  }),
  loadSlots: defineHandler({
    handler: async (formData, _args) => {
      const { container } = await import("@/core/di/server");
      const tenantId = formData.get("tenantId") as string;
      const menuId = formData.get("menuId") as string;
      const staffProfileId = formData.get("staffProfileId") as string | null;
      const dateStr = formData.get("date") as string;

      const result = await handleUseCase(() =>
        getAvailableSlots({
          container,
          headers: _args.request.headers,
          input: {
            tenantId,
            menuId,
            staffProfileId: staffProfileId || null,
            date: dateStr,
          },
        }),
      ).match(
        (r) => r,
        () => ({ slots: [] as AvailableSlot[] }),
      );

      return success({ slots: result.slots });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");
  const reservationId = params.id;

  const reservation = await handleUseCase(() =>
    getReservation({
      container,
      headers: request.headers,
      input: { reservationId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const tenant = await handleUseCase(() =>
    getTenant({
      container,
      headers: request.headers,
      input: { tenantId: reservation.tenantId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const menusResult = await handleUseCase(() =>
    listMenus({
      container,
      headers: request.headers,
      input: { tenantId: reservation.tenantId },
    }),
  ).match(
    (r) => r,
    () => ({ items: [] as MenuDetail[] }),
  );

  return {
    reservation,
    tenant,
    menus: menusResult.items,
  };
}

export default function ReservationEditPage({
  loaderData,
}: Route.ComponentProps) {
  const { reservation, tenant, menus } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const staffFetcher = useFetcher();
  const slotsFetcher = useFetcher();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(reservation.date);
  const [selectedStartTime, setSelectedStartTime] = useState(
    reservation.startTime,
  );
  const [selectedMenuId, setSelectedMenuId] = useState(
    menus.find((m) => m.name === reservation.menuName)?.id ?? "",
  );
  const [selectedStaffProfileId, setSelectedStaffProfileId] = useState("");

  // メニュー変更時にスタッフ一覧を取得
  const staffFetcherSubmit = staffFetcher.submit;
  useEffect(() => {
    if (selectedMenuId) {
      staffFetcherSubmit(
        {
          intent: "loadStaff",
          tenantId: tenant.id,
          menuId: selectedMenuId,
        },
        { method: "post" },
      );
    }
  }, [selectedMenuId, tenant.id, staffFetcherSubmit]);

  // 日付選択時にスロットを取得
  const slotsFetcherSubmit = slotsFetcher.submit;
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      setSelectedStartTime("");
      if (selectedMenuId) {
        slotsFetcherSubmit(
          {
            intent: "loadSlots",
            tenantId: tenant.id,
            menuId: selectedMenuId,
            staffProfileId: selectedStaffProfileId || "",
            date: dateStr,
          },
          { method: "post" },
        );
      }
    },
    [selectedMenuId, selectedStaffProfileId, tenant.id, slotsFetcherSubmit],
  );

  const staff: StaffProfileSummary[] = staffFetcher.data?.data?.staff ?? [];
  const slots: AvailableSlot[] = slotsFetcher.data?.data?.slots ?? [];
  const isLoadingSlots = slotsFetcher.state !== "idle";

  const [form, fields] = useForm({
    id: "update-reservation-form",
    defaultValue: {
      reservationId: reservation.id,
      menuId: selectedMenuId,
      staffProfileId: selectedStaffProfileId,
      date: reservation.date,
      startTime: reservation.startTime,
      note: reservation.note ?? "",
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
      navigate(`/mypage/reservations/${reservation.id}`);
    },
  });

  const isPending = fetcher.isPending("updateReservation");

  // 予約可能な日付を生成
  const bookingWindowDays = tenant.reservationSettings.bookingWindowDays;
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < bookingWindowDays && i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const isHoliday = tenant.regularHolidays.includes(dayOfWeek);
    if (!isHoliday) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }
  }

  const DAY_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/mypage/reservations/${reservation.id}`}
          className="text-sm text-text-secondary hover:text-text"
        >
          予約詳細に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-text">予約変更</h1>

      <Card className="mb-6 bg-surface-secondary">
        <CardBody>
          <h2 className="mb-2 text-sm font-medium text-text-secondary">
            現在の予約内容
          </h2>
          <p className="text-sm text-text">
            {reservation.menuName}
            {reservation.staffName && ` / ${reservation.staffName}`}
          </p>
          <p className="text-sm text-text-secondary">
            {new Date(reservation.date).toLocaleDateString("ja-JP")}{" "}
            {reservation.startTime} - {reservation.endTime}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <fetcher.Form method="post" {...getFormProps(form)}>
            <input type="hidden" name="intent" value="updateReservation" />
            <input type="hidden" name="reservationId" value={reservation.id} />
            <input type="hidden" name="date" value={selectedDate} />
            <input type="hidden" name="startTime" value={selectedStartTime} />

            <div className="space-y-5">
              {/* メニュー選択 */}
              <FormField
                label="メニュー"
                htmlFor={fields.menuId.id}
                error={fields.menuId.errors}
                required
              >
                <Select
                  id={fields.menuId.id}
                  name={fields.menuId.name}
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  error={fields.menuId.errors?.[0]}
                >
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name} ({menu.duration}分 /{" "}
                      {menu.price.toLocaleString()}円)
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* スタッフ選択 */}
              <FormField
                label="担当スタッフ"
                htmlFor={fields.staffProfileId.id}
              >
                <Select
                  id={fields.staffProfileId.id}
                  name={fields.staffProfileId.name}
                  value={selectedStaffProfileId}
                  onChange={(e) => setSelectedStaffProfileId(e.target.value)}
                >
                  <option value="">指名なし</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* 日付選択 */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-text-secondary">
                  日付を選択
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dates.map((dateStr) => {
                    const d = new Date(dateStr);
                    const dayLabel = DAY_SHORT[d.getDay()];
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDateSelect(dateStr)}
                        className={`flex flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedDate === dateStr
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xs text-text-muted">
                          {dayLabel}
                        </span>
                        <span className="font-medium">{d.getDate()}</span>
                        <span className="text-xs text-text-muted">
                          {d.getMonth() + 1}月
                        </span>
                      </button>
                    );
                  })}
                </div>
                {fields.date.errors && (
                  <p className="mt-1 text-xs text-destructive">
                    {fields.date.errors}
                  </p>
                )}
              </div>

              {/* 時間選択 */}
              {selectedDate && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-text-secondary">
                    時間を選択
                  </h3>
                  {isLoadingSlots ? (
                    <p className="py-4 text-center text-text-secondary">
                      空き時間を確認中...
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="py-4 text-center text-text-secondary">
                      この日に空きはありません
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {slots.map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedStartTime(slot.startTime)}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            selectedStartTime === slot.startTime
                              ? "border-primary bg-primary/5 text-primary"
                              : slot.available
                                ? "border-border hover:border-primary hover:bg-primary/5"
                                : "cursor-not-allowed border-border bg-surface-secondary text-text-muted line-through"
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                  {fields.startTime.errors && (
                    <p className="mt-1 text-xs text-destructive">
                      {fields.startTime.errors}
                    </p>
                  )}
                </div>
              )}

              {/* 変更後の差分表示 */}
              {selectedMenu && selectedDate && selectedStartTime && (
                <Card className="bg-surface-secondary">
                  <CardBody>
                    <h3 className="mb-2 text-sm font-medium text-text-secondary">
                      変更後の予約内容
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">メニュー</span>
                        <span className="font-medium">
                          {selectedMenu.name}
                          {selectedMenu.name !== reservation.menuName && (
                            <Badge variant="primary" className="ml-2">
                              変更
                            </Badge>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">日時</span>
                        <span className="font-medium">
                          {new Date(selectedDate).toLocaleDateString("ja-JP")}{" "}
                          {selectedStartTime}
                          {(selectedDate !== reservation.date ||
                            selectedStartTime !== reservation.startTime) && (
                            <Badge variant="primary" className="ml-2">
                              変更
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* 備考 */}
              <FormField label="備考" htmlFor={fields.note.id}>
                <textarea
                  id={fields.note.id}
                  name={fields.note.name}
                  defaultValue={fields.note.initialValue}
                  rows={3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ご要望があればご記入ください"
                />
              </FormField>

              {form.errors && (
                <p className="text-xs text-destructive">{form.errors}</p>
              )}

              <div className="flex gap-3">
                <Link to={`/mypage/reservations/${reservation.id}`}>
                  <Button type="button" variant="outline">
                    キャンセル
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
