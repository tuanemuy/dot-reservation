import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCallback, useEffect, useState } from "react";
import { data, Link, useFetcher, useNavigate } from "react-router";
import { z } from "zod";
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}）`;
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
  const [step, setStep] = useState<"select" | "confirm">("select");

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
  const selectedStaff = staff.find((s) => s.id === selectedStaffProfileId);

  const canProceed = selectedMenu && selectedDate && selectedStartTime;

  // Check what has changed
  const menuChanged = selectedMenu?.name !== reservation.menuName;
  const dateTimeChanged =
    selectedDate !== reservation.date ||
    selectedStartTime !== reservation.startTime;
  const staffChanged =
    selectedStaff?.displayName !== reservation.staffName &&
    !(!selectedStaff?.displayName && !reservation.staffName);

  if (step === "confirm" && canProceed) {
    return (
      <div>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-neutral-900)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
            marginBottom: "var(--space-lg)",
          }}
        >
          予約変更
        </h1>

        {/* Steps Indicator */}
        <div
          className="flex items-center"
          style={{ gap: "var(--space-sm)", marginBottom: "var(--space-xl)" }}
        >
          <div
            className="flex items-center"
            style={{
              gap: "var(--space-sm)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-primary-light)",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                background: "var(--color-primary-lighter)",
                borderColor: "var(--color-primary-light)",
                border: "2px solid var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              1
            </div>
            <span>日時選択</span>
          </div>
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "var(--color-primary-light)",
              borderRadius: "1px",
            }}
          />
          <div
            className="flex items-center"
            style={{
              gap: "var(--space-sm)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-primary)",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                background: "var(--color-primary)",
                border: "2px solid var(--color-primary)",
                color: "#FFFFFF",
              }}
            >
              2
            </div>
            <span>変更確認</span>
          </div>
        </div>

        {/* Info Banner */}
        <div
          className="flex items-start"
          style={{
            gap: "var(--space-sm)",
            padding: "var(--space-md) var(--space-lg)",
            background: "oklch(0.55 0.10 240 / 0.06)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-xl)",
            fontSize: "var(--text-sm)",
            color: "var(--color-info)",
            lineHeight: "var(--leading-normal)",
          }}
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              width: "18px",
              height: "18px",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <span>
            変更内容をご確認の上、「変更を確定する」ボタンを押してください。変更後、店舗の承認が必要な場合があります。
          </span>
        </div>

        {/* Comparison Card */}
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "var(--space-lg)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                padding: "var(--space-md) var(--space-xl)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-neutral-600)",
                letterSpacing: "var(--tracking-wide)",
                borderBottom: "1px solid var(--color-neutral-300)",
                background: "var(--color-neutral-100)",
              }}
            >
              変更前
            </div>
            <div
              style={{
                padding: "var(--space-md) var(--space-xl)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-primary)",
                letterSpacing: "var(--tracking-wide)",
                borderBottom: "1px solid var(--color-neutral-300)",
                background: "var(--color-primary-lighter)",
              }}
            >
              変更後
            </div>
          </div>
          <div className="flex flex-col">
            {[
              {
                label: "メニュー",
                before: `${reservation.menuName} ${reservation.menuDuration}分`,
                after: `${selectedMenu.name} ${selectedMenu.duration}分`,
                changed: menuChanged,
              },
              {
                label: "担当スタッフ",
                before: reservation.staffName ?? "指名なし",
                after: selectedStaff?.displayName ?? "指名なし",
                changed: staffChanged,
              },
              {
                label: "予約日時",
                before: `${formatDate(reservation.date)} ${reservation.startTime} - ${reservation.endTime}`,
                after: `${formatDate(selectedDate)} ${selectedStartTime}`,
                changed: dateTimeChanged,
              },
              {
                label: "料金",
                before: `\u00a5${reservation.menuPrice.toLocaleString()}（税込）`,
                after: `\u00a5${selectedMenu.price.toLocaleString()}（税込）`,
                changed: reservation.menuPrice !== selectedMenu.price,
              },
            ].map((row, idx, arr) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom:
                    idx < arr.length - 1
                      ? "1px solid var(--color-neutral-200)"
                      : "none",
                }}
              >
                <div
                  className="flex flex-col"
                  style={{
                    padding: "var(--space-md) var(--space-xl)",
                    gap: "var(--space-xs)",
                    background: "var(--color-neutral-50)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--color-neutral-500)",
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-base)",
                      color: "var(--color-neutral-800)",
                    }}
                  >
                    {row.before}
                  </div>
                </div>
                <div
                  className="flex flex-col"
                  style={{
                    padding: "var(--space-md) var(--space-xl)",
                    gap: "var(--space-xs)",
                    background: row.changed
                      ? "var(--color-accent-lighter)"
                      : "var(--color-bg-card)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--color-neutral-500)",
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-base)",
                      color: row.changed
                        ? "var(--color-accent-dark)"
                        : "var(--color-neutral-800)",
                      fontWeight: row.changed
                        ? "var(--weight-semibold)"
                        : ("var(--weight-normal)" as string),
                    }}
                  >
                    {row.after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex justify-end"
          style={{ gap: "var(--space-md)", marginTop: "var(--space-lg)" }}
        >
          <button
            type="button"
            onClick={() => setStep("select")}
            className="inline-flex items-center justify-center"
            style={{
              gap: "var(--space-sm)",
              height: "44px",
              padding: "0 var(--space-lg)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              color: "var(--color-neutral-700)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: "16px", height: "16px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            戻る
          </button>
          <fetcher.Form method="post" {...getFormProps(form)}>
            <input type="hidden" name="intent" value="updateReservation" />
            <input type="hidden" name="reservationId" value={reservation.id} />
            <input type="hidden" name="menuId" value={selectedMenuId} />
            <input
              type="hidden"
              name="staffProfileId"
              value={selectedStaffProfileId}
            />
            <input type="hidden" name="date" value={selectedDate} />
            <input type="hidden" name="startTime" value={selectedStartTime} />
            <input type="hidden" name="note" value={reservation.note ?? ""} />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center"
              style={{
                gap: "var(--space-sm)",
                height: "44px",
                padding: "0 var(--space-xl)",
                background: "var(--color-primary)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                cursor: isPending ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {isPending ? "変更中..." : "変更を確定する"}
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: "16px", height: "16px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </button>
          </fetcher.Form>
        </div>
        {form.errors && (
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-error)",
              marginTop: "var(--space-md)",
              textAlign: "right",
            }}
          >
            {form.errors}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-neutral-900)",
          letterSpacing: "var(--tracking-tight)",
          lineHeight: "var(--leading-tight)",
          marginBottom: "var(--space-lg)",
        }}
      >
        予約変更
      </h1>

      {/* Steps Indicator */}
      <div
        className="flex items-center"
        style={{ gap: "var(--space-sm)", marginBottom: "var(--space-xl)" }}
      >
        <div
          className="flex items-center"
          style={{
            gap: "var(--space-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-primary)",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              background: "var(--color-primary)",
              border: "2px solid var(--color-primary)",
              color: "#FFFFFF",
            }}
          >
            1
          </div>
          <span>日時選択</span>
        </div>
        <div
          style={{
            width: "40px",
            height: "2px",
            background: "var(--color-neutral-300)",
            borderRadius: "1px",
          }}
        />
        <div
          className="flex items-center"
          style={{
            gap: "var(--space-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-neutral-500)",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              border: "2px solid var(--color-neutral-300)",
              color: "var(--color-neutral-500)",
            }}
          >
            2
          </div>
          <span>変更確認</span>
        </div>
      </div>

      {/* Form Card */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
          }}
        >
          {/* Menu */}
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
                  {menu.name} ({menu.duration}分 / {menu.price.toLocaleString()}
                  円)
                </option>
              ))}
            </Select>
          </FormField>

          {/* Staff */}
          <FormField label="担当スタッフ" htmlFor={fields.staffProfileId.id}>
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

          {/* Date */}
          <div>
            <h3
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-700)",
                marginBottom: "var(--space-sm)",
              }}
            >
              日付を選択
            </h3>
            <div className="flex flex-wrap" style={{ gap: "var(--space-sm)" }}>
              {dates.map((dateStr) => {
                const d = new Date(dateStr);
                const dayLabel = DAY_SHORT[d.getDay()];
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateSelect(dateStr)}
                    className="flex flex-col items-center"
                    style={{
                      borderRadius: "var(--radius-md)",
                      border:
                        selectedDate === dateStr
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-neutral-300)",
                      padding: "var(--space-sm) var(--space-md)",
                      fontSize: "var(--text-sm)",
                      background:
                        selectedDate === dateStr
                          ? "var(--color-primary-lighter)"
                          : "var(--color-bg-card)",
                      color:
                        selectedDate === dateStr
                          ? "var(--color-primary)"
                          : "var(--color-neutral-700)",
                      cursor: "pointer",
                      transition: "all var(--transition-default)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {dayLabel}
                    </span>
                    <span style={{ fontWeight: "var(--weight-medium)" }}>
                      {d.getDate()}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      {d.getMonth() + 1}月
                    </span>
                  </button>
                );
              })}
            </div>
            {fields.date.errors && (
              <p
                style={{
                  marginTop: "var(--space-xs)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-error)",
                }}
              >
                {fields.date.errors}
              </p>
            )}
          </div>

          {/* Time */}
          {selectedDate && (
            <div>
              <h3
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: "var(--color-neutral-700)",
                  marginBottom: "var(--space-sm)",
                }}
              >
                時間を選択
              </h3>
              {isLoadingSlots ? (
                <p
                  className="py-4 text-center"
                  style={{ color: "var(--color-neutral-500)" }}
                >
                  空き時間を確認中...
                </p>
              ) : slots.length === 0 ? (
                <p
                  className="py-4 text-center"
                  style={{ color: "var(--color-neutral-500)" }}
                >
                  この日に空きはありません
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "var(--space-sm)",
                  }}
                >
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedStartTime(slot.startTime)}
                      style={{
                        borderRadius: "var(--radius-md)",
                        border:
                          selectedStartTime === slot.startTime
                            ? "1px solid var(--color-primary)"
                            : "1px solid var(--color-neutral-300)",
                        padding: "var(--space-sm) var(--space-md)",
                        fontSize: "var(--text-sm)",
                        background:
                          selectedStartTime === slot.startTime
                            ? "var(--color-primary-lighter)"
                            : slot.available
                              ? "var(--color-bg-card)"
                              : "var(--color-neutral-100)",
                        color:
                          selectedStartTime === slot.startTime
                            ? "var(--color-primary)"
                            : slot.available
                              ? "var(--color-neutral-700)"
                              : "var(--color-neutral-400)",
                        cursor: slot.available ? "pointer" : "not-allowed",
                        textDecoration: slot.available
                          ? "none"
                          : "line-through",
                        transition: "all var(--transition-default)",
                      }}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
              {fields.startTime.errors && (
                <p
                  style={{
                    marginTop: "var(--space-xs)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-error)",
                  }}
                >
                  {fields.startTime.errors}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex justify-end"
        style={{ gap: "var(--space-md)", marginTop: "var(--space-lg)" }}
      >
        <Link
          to={`/mypage/reservations/${reservation.id}`}
          className="inline-flex items-center justify-center"
          style={{
            gap: "var(--space-sm)",
            height: "44px",
            padding: "0 var(--space-lg)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-neutral-300)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-neutral-700)",
            textDecoration: "none",
          }}
        >
          キャンセル
        </Link>
        <button
          type="button"
          disabled={!canProceed}
          onClick={() => setStep("confirm")}
          className="inline-flex items-center justify-center"
          style={{
            gap: "var(--space-sm)",
            height: "44px",
            padding: "0 var(--space-xl)",
            background: canProceed
              ? "var(--color-primary)"
              : "var(--color-neutral-300)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            cursor: canProceed ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          確認画面へ
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ width: "16px", height: "16px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
