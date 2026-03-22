import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader で予約設定を取得
// TODO: action で予約設定更新を実装

type ReservationSettings = {
  acceptancePeriodDays: number;
  deadlineHours: number;
  cancelDeadlineHours: number;
  slotDurationMinutes: number;
  bufferMinutes: number;
  approvalMethod: "auto" | "manual";
};

export default function TenantReservationSettingsPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [settings, setSettings] = useState<ReservationSettings>({
    acceptancePeriodDays: 30,
    deadlineHours: 24,
    cancelDeadlineHours: 24,
    slotDurationMinutes: 30,
    bufferMinutes: 10,
    approvalMethod: "auto",
  });

  const settingsItems = [
    {
      key: "acceptancePeriodDays",
      label: "予約受付期間",
      description: "何日先まで予約を受け付けるか",
      value: `${settings.acceptancePeriodDays}日先まで`,
      type: "number" as const,
      suffix: "日先まで",
    },
    {
      key: "deadlineHours",
      label: "予約受付締切",
      description: "予約希望日の何時間前まで受け付けるか",
      value: `${settings.deadlineHours}時間前まで`,
      type: "number" as const,
      suffix: "時間前まで",
    },
    {
      key: "cancelDeadlineHours",
      label: "キャンセル期限",
      description: "予約日の何時間前までキャンセル可能か",
      value: `${settings.cancelDeadlineHours}時間前まで`,
      type: "number" as const,
      suffix: "時間前まで",
    },
    {
      key: "slotDurationMinutes",
      label: "予約枠の時間単位",
      description: "予約枠の最小時間単位",
      value: `${settings.slotDurationMinutes}分`,
      type: "number" as const,
      suffix: "分",
    },
    {
      key: "bufferMinutes",
      label: "予約間バッファ時間",
      description: "予約と予約の間に必要な空き時間",
      value: `${settings.bufferMinutes}分`,
      type: "number" as const,
      suffix: "分",
    },
  ];

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
                <Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="intent" value="updateSetting" />
                  <input type="hidden" name="settingKey" value={item.key} />
                  <input
                    name="value"
                    type="number"
                    min={0}
                    defaultValue={
                      settings[item.key as keyof ReservationSettings] as number
                    }
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
                    disabled={isSubmitting}
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
                </Form>
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
              <Form method="post" className="flex items-center gap-2">
                <input type="hidden" name="intent" value="updateSetting" />
                <input type="hidden" name="settingKey" value="approvalMethod" />
                <select
                  name="value"
                  defaultValue={settings.approvalMethod}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      approvalMethod: e.target.value as "auto" | "manual",
                    }));
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="auto">自動承認</option>
                  <option value="manual">手動承認</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting}
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
              </Form>
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
