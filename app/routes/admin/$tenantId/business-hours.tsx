import { useState } from "react";
import { Form, useNavigation } from "react-router";

// TODO: loader で営業設定を取得
// TODO: action で営業設定更新を実装

const daysOfWeek = [
  { key: "monday", label: "月曜日" },
  { key: "tuesday", label: "火曜日" },
  { key: "wednesday", label: "水曜日" },
  { key: "thursday", label: "木曜日" },
  { key: "friday", label: "金曜日" },
  { key: "saturday", label: "土曜日" },
  { key: "sunday", label: "日曜日" },
];

type BusinessHour = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type SpecialClosedDay = {
  id: string;
  date: string;
  reason: string;
};

export default function TenantBusinessHoursPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    daysOfWeek.map((day) => ({
      day: day.key,
      isOpen: day.key !== "sunday",
      openTime: "09:00",
      closeTime: "18:00",
    })),
  );

  const [specialClosedDays, setSpecialClosedDays] = useState<
    SpecialClosedDay[]
  >([{ id: "1", date: "2024-12-31", reason: "年末休業" }]);

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

  const removeSpecialClosedDay = (id: string) => {
    setSpecialClosedDays((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">営業設定</h1>

      <div className="max-w-2xl space-y-8">
        {/* 営業時間 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">営業時間</h2>
            {editingSection === "hours" ? (
              <div className="flex gap-2">
                <Form method="post">
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
                    disabled={isSubmitting}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "保存中..." : "保存"}
                  </button>
                </Form>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingSection("hours")}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                編集
              </button>
            )}
          </div>

          <div className="space-y-3">
            {businessHours.map((hour, index) => {
              const dayLabel =
                daysOfWeek.find((d) => d.key === hour.day)?.label ?? hour.day;
              return (
                <div key={hour.day} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    {dayLabel}
                  </div>
                  {editingSection === "hours" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          hour.isOpen ? "bg-blue-600" : "bg-gray-200"
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
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) =>
                              updateTime(index, "closeTime", e.target.value)
                            }
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-600">
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
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">臨時休業日</h2>
          </div>

          {/* 追加フォーム */}
          <Form method="post" className="mb-4 flex items-end gap-4">
            <input type="hidden" name="intent" value="addSpecialClosedDay" />
            <div>
              <label
                htmlFor="closedDate"
                className="block text-sm font-medium text-gray-700"
              >
                日付
              </label>
              <input
                id="closedDate"
                name="date"
                type="date"
                required
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="closedReason"
                className="block text-sm font-medium text-gray-700"
              >
                理由
              </label>
              <input
                id="closedReason"
                name="reason"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="例: 臨時休業"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              追加
            </button>
          </Form>

          {/* 一覧 */}
          {specialClosedDays.length === 0 ? (
            <p className="text-sm text-gray-500">
              臨時休業日は設定されていません
            </p>
          ) : (
            <div className="space-y-2">
              {specialClosedDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {day.date}
                    </span>
                    {day.reason && (
                      <span className="ml-3 text-sm text-gray-500">
                        {day.reason}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSpecialClosedDay(day.id)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
