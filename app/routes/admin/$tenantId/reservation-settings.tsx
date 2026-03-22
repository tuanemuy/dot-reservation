import { useState } from "react";
import { data } from "react-router";
import { z } from "zod";
import { getTenant } from "@/core/application/tenant/getTenant";
import { updateReservationSettings } from "@/core/application/tenant/updateReservationSettings";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/reservation-settings";

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

  return { settings: tenantResult.reservationSettings };
}

const updateSettingSchema = z.object({
  bookingWindowDays: z.coerce.number().min(1),
  bookingDeadlineHours: z.coerce.number().min(0),
  cancellationDeadlineHours: z.coerce.number().min(0),
  slotDurationMinutes: z.coerce.number().min(5),
  bufferMinutes: z.coerce.number().min(0),
  approvalMethod: z.string().min(1),
});

export const handlers = {
  updateSettings: defineHandler({
    schema: updateSettingSchema,
    handler: async (value, args) => {
      return handleUseCase(() =>
        updateReservationSettings({
          container,
          headers: args.request.headers,
          input: {
            tenantId: args.params.tenantId!,
            bookingWindowDays: value.bookingWindowDays,
            bookingDeadlineHours: value.bookingDeadlineHours,
            cancellationDeadlineHours: value.cancellationDeadlineHours,
            slotDurationMinutes: value.slotDurationMinutes,
            bufferMinutes: value.bufferMinutes,
            approvalMethod: value.approvalMethod,
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

type ReservationSettingsState = {
  bookingWindowDays: number;
  bookingDeadlineHours: number;
  cancellationDeadlineHours: number;
  slotDurationMinutes: number;
  bufferMinutes: number;
  approvalMethod: string;
};

export default function TenantReservationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [settings, setSettings] = useState<ReservationSettingsState>({
    bookingWindowDays: loaderData.settings.bookingWindowDays,
    bookingDeadlineHours: loaderData.settings.bookingDeadlineHours,
    cancellationDeadlineHours: loaderData.settings.cancellationDeadlineHours,
    slotDurationMinutes: loaderData.settings.slotDurationMinutes,
    bufferMinutes: loaderData.settings.bufferMinutes,
    approvalMethod: loaderData.settings.approvalMethod,
  });

  fetcher.register("updateSettings", {
    onSuccess: () => {
      setEditingSection(null);
    },
  });

  const isPending = fetcher.isPending("updateSettings");

  const settingsItems = [
    {
      key: "bookingWindowDays" as const,
      label: "予約受付期間",
      description: "何日先まで予約を受け付けるか",
      value: `${settings.bookingWindowDays}日先まで`,
      suffix: "日先まで",
    },
    {
      key: "bookingDeadlineHours" as const,
      label: "予約受付締切",
      description: "予約希望日の何時間前まで受け付けるか",
      value: `${settings.bookingDeadlineHours}時間前まで`,
      suffix: "時間前まで",
    },
    {
      key: "cancellationDeadlineHours" as const,
      label: "キャンセル期限",
      description: "予約日の何時間前までキャンセル可能か",
      value: `${settings.cancellationDeadlineHours}時間前まで`,
      suffix: "時間前まで",
    },
    {
      key: "slotDurationMinutes" as const,
      label: "予約枠の時間単位",
      description: "予約枠の最小時間単位",
      value: `${settings.slotDurationMinutes}分`,
      suffix: "分",
    },
    {
      key: "bufferMinutes" as const,
      label: "予約間バッファ時間",
      description: "予約と予約の間に必要な空き時間",
      value: `${settings.bufferMinutes}分`,
      suffix: "分",
    },
  ];

  const submitSettings = () => {
    // Submit is handled through the form
  };

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">予約設定</h1>

      <div className="max-w-2xl space-y-4">
        {/* 各設定項目 */}
        {settingsItems.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {item.label}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{item.description}</p>
              </div>
              {editingSection === item.key ? (
                <fetcher.Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="intent" value="updateSettings" />
                  <input
                    type="hidden"
                    name="bookingWindowDays"
                    value={settings.bookingWindowDays}
                  />
                  <input
                    type="hidden"
                    name="bookingDeadlineHours"
                    value={settings.bookingDeadlineHours}
                  />
                  <input
                    type="hidden"
                    name="cancellationDeadlineHours"
                    value={settings.cancellationDeadlineHours}
                  />
                  <input
                    type="hidden"
                    name="slotDurationMinutes"
                    value={settings.slotDurationMinutes}
                  />
                  <input
                    type="hidden"
                    name="bufferMinutes"
                    value={settings.bufferMinutes}
                  />
                  <input
                    type="hidden"
                    name="approvalMethod"
                    value={settings.approvalMethod}
                  />
                  <input
                    name={item.key}
                    type="number"
                    min={0}
                    defaultValue={settings[item.key]}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        [item.key]: Number(e.target.value),
                      }));
                    }}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-gray-500">{item.suffix}</span>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                </fetcher.Form>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {item.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingSection(item.key)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    編集
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 予約承認方法 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                予約承認方法
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                予約を自動承認するか手動承認するか
              </p>
            </div>
            {editingSection === "approvalMethod" ? (
              <fetcher.Form method="post" className="flex items-center gap-2">
                <input type="hidden" name="intent" value="updateSettings" />
                <input
                  type="hidden"
                  name="bookingWindowDays"
                  value={settings.bookingWindowDays}
                />
                <input
                  type="hidden"
                  name="bookingDeadlineHours"
                  value={settings.bookingDeadlineHours}
                />
                <input
                  type="hidden"
                  name="cancellationDeadlineHours"
                  value={settings.cancellationDeadlineHours}
                />
                <input
                  type="hidden"
                  name="slotDurationMinutes"
                  value={settings.slotDurationMinutes}
                />
                <input
                  type="hidden"
                  name="bufferMinutes"
                  value={settings.bufferMinutes}
                />
                <select
                  name="approvalMethod"
                  defaultValue={settings.approvalMethod}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      approvalMethod: e.target.value,
                    }));
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="auto">自動承認</option>
                  <option value="manual">手動承認</option>
                </select>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
              </fetcher.Form>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {settings.approvalMethod === "auto" ? "自動承認" : "手動承認"}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingSection("approvalMethod")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
