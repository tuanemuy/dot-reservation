import { useState } from "react";
import { data } from "react-router";
import { z } from "zod";
import { addTemporaryHoliday } from "@/core/application/tenant/addTemporaryHoliday";
import { getTenant } from "@/core/application/tenant/getTenant";
import { removeTemporaryHoliday } from "@/core/application/tenant/removeTemporaryHoliday";
import { updateBusinessHours } from "@/core/application/tenant/updateBusinessHours";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/business-hours";

const daysOfWeek = [
  { key: 1, label: "月曜日" },
  { key: 2, label: "火曜日" },
  { key: 3, label: "水曜日" },
  { key: 4, label: "木曜日" },
  { key: 5, label: "金曜日" },
  { key: 6, label: "土曜日" },
  { key: 0, label: "日曜日" },
];

type BusinessHour = {
  dayKey: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const tenantResult = await handleUseCase(() =>
    getTenant({
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

  return { tenant: tenantResult };
}

const updateBusinessHoursSchema = z.object({
  hours: z.string().min(1),
});

const addSpecialClosedDaySchema = z.object({
  date: z.string().min(1, "日付を入力してください"),
  reason: z.string().optional().default(""),
});

const removeSpecialClosedDaySchema = z.object({
  date: z.string().min(1),
});

export const handlers = {
  updateBusinessHours: defineHandler({
    schema: updateBusinessHoursSchema,
    handler: async (value, args) => {
      const hours = JSON.parse(value.hours) as BusinessHour[];
      const businessHours: Record<
        number,
        { open: string; close: string } | null
      > = {};

      for (const hour of hours) {
        businessHours[hour.dayKey] = hour.isOpen
          ? { open: hour.openTime, close: hour.closeTime }
          : null;
      }

      return handleUseCase(() =>
        updateBusinessHours({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            businessHours,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  addSpecialClosedDay: defineHandler({
    schema: addSpecialClosedDaySchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        addTemporaryHoliday({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            date: value.date,
            reason: value.reason || null,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  removeSpecialClosedDay: defineHandler({
    schema: removeSpecialClosedDaySchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        removeTemporaryHoliday({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId as string,
            date: value.date,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export default function TenantBusinessHoursPage({
  loaderData,
}: Route.ComponentProps) {
  const { tenant } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const initialHours: BusinessHour[] = daysOfWeek.map((day) => {
    const hours = tenant.businessHours[day.key];
    return {
      dayKey: day.key,
      isOpen: hours !== null,
      openTime: hours?.open ?? "09:00",
      closeTime: hours?.close ?? "18:00",
    };
  });

  const [businessHours, setBusinessHours] =
    useState<BusinessHour[]>(initialHours);

  const [editingSection, setEditingSection] = useState<string | null>(null);

  const toggleDay = (index: number) => {
    const newHours = [...businessHours];
    const hour = newHours[index];
    if (hour) {
      newHours[index] = { ...hour, isOpen: !hour.isOpen };
      setBusinessHours(newHours);
    }
  };

  const updateTime = (
    index: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    const newHours = [...businessHours];
    const hour = newHours[index];
    if (hour) {
      newHours[index] = { ...hour, [field]: value };
      setBusinessHours(newHours);
    }
  };

  fetcher.register("updateBusinessHours", {
    onSuccess: () => {
      setEditingSection(null);
    },
  });

  const isPendingHours = fetcher.isPending("updateBusinessHours");
  const isPendingAddClosed = fetcher.isPending("addSpecialClosedDay");

  return (
    <div className="">
      <h1 className="mb-8 font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
        営業設定
      </h1>

      <div className="max-w-2xl space-y-8">
        {/* 営業時間 */}
        <section className="rounded-lg border border-neutral-300 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-800">
              営業時間
            </h2>
            {editingSection === "hours" ? (
              <div className="flex gap-2">
                <fetcher.Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="updateBusinessHours"
                  />
                  <input
                    type="hidden"
                    name="hours"
                    value={JSON.stringify(businessHours)}
                  />
                  <button
                    type="submit"
                    disabled={isPendingHours}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isPendingHours ? "保存中..." : "保存"}
                  </button>
                </fetcher.Form>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingSection("hours")}
                className="text-sm font-medium text-primary hover:text-primary"
              >
                編集
              </button>
            )}
          </div>

          <div className="space-y-3">
            {businessHours.map((hour, index) => {
              const dayLabel =
                daysOfWeek.find((d) => d.key === hour.dayKey)?.label ??
                String(hour.dayKey);
              return (
                <div key={hour.dayKey} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-neutral-600">
                    {dayLabel}
                  </div>
                  {editingSection === "hours" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          hour.isOpen ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            hour.isOpen ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      {hour.isOpen && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) =>
                              updateTime(index, "openTime", e.target.value)
                            }
                            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <span className="text-neutral-500">-</span>
                          <input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) =>
                              updateTime(index, "closeTime", e.target.value)
                            }
                            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-neutral-600">
                      {hour.isOpen
                        ? `${hour.openTime} - ${hour.closeTime}`
                        : "休業"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 臨時休業日 */}
        <section className="rounded-lg border border-neutral-300 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-neutral-800">
              臨時休業日
            </h2>
          </div>

          {/* 追加フォーム */}
          <fetcher.Form method="post" className="mb-4 flex items-end gap-4">
            <input type="hidden" name="intent" value="addSpecialClosedDay" />
            <div>
              <label
                htmlFor="closedDate"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                日付
              </label>
              <input
                id="closedDate"
                name="date"
                type="date"
                required
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="closedReason"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                理由
              </label>
              <input
                id="closedReason"
                name="reason"
                type="text"
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                placeholder="例: 臨時休業"
              />
            </div>
            <button
              type="submit"
              disabled={isPendingAddClosed}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium tracking-wide text-white transition-[background,transform] duration-150 hover:bg-primary-dark active:scale-[0.99] disabled:opacity-50"
            >
              追加
            </button>
          </fetcher.Form>

          {/* 一覧 */}
          {tenant.temporaryHolidays.length === 0 ? (
            <p className="text-sm text-neutral-500">
              臨時休業日は設定されていません
            </p>
          ) : (
            <div className="space-y-2">
              {tenant.temporaryHolidays.map((day) => {
                const dateStr = new Date(day.date).toLocaleDateString("ja-JP");
                const isoDate = day.date.split("T")[0];
                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-between rounded-md bg-neutral-200 px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-neutral-800">
                        {dateStr}
                      </span>
                      {day.reason && (
                        <span className="ml-3 text-sm text-neutral-500">
                          {day.reason}
                        </span>
                      )}
                    </div>
                    <fetcher.Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="intent"
                        value="removeSpecialClosedDay"
                      />
                      <input type="hidden" name="date" value={isoDate} />
                      <button
                        type="submit"
                        className="text-sm text-destructive hover:text-destructive"
                      >
                        削除
                      </button>
                    </fetcher.Form>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
