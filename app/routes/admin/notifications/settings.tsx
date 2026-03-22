import { useState } from "react";

// TODO: loader で通知設定を取得
// TODO: action で通知設定を保存（自動保存）

type NotificationSetting = {
  type: string;
  label: string;
  email: boolean;
  inApp: boolean;
};

const defaultSettings: NotificationSetting[] = [
  {
    type: "newReservation",
    label: "新規予約",
    email: true,
    inApp: true,
  },
  {
    type: "reservationCancelled",
    label: "予約キャンセル",
    email: true,
    inApp: true,
  },
  {
    type: "reservationChanged",
    label: "予約変更",
    email: true,
    inApp: true,
  },
  {
    type: "memberJoined",
    label: "メンバー参加",
    email: false,
    inApp: true,
  },
  {
    type: "announcement",
    label: "お知らせ",
    email: true,
    inApp: true,
  },
];

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] =
    useState<NotificationSetting[]>(defaultSettings);

  const handleToggle = (index: number, field: "email" | "inApp") => {
    const newSettings = [...settings];
    const setting = newSettings[index];
    if (setting) {
      newSettings[index] = { ...setting, [field]: !setting[field] };
      setSettings(newSettings);
      // TODO: 自動保存を実装
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">通知設定</h1>

      <div className="max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-gray-700">通知種別</div>
              <div className="text-center text-sm font-medium text-gray-700">
                メール通知
              </div>
              <div className="text-center text-sm font-medium text-gray-700">
                アプリ内通知
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {settings.map((setting, index) => (
              <div
                key={setting.type}
                className="grid grid-cols-3 gap-4 px-6 py-4"
              >
                <div className="flex items-center text-sm text-gray-900">
                  {setting.label}
                </div>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(index, "email")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      setting.email ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    aria-label={`${setting.label}のメール通知`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.email ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(index, "inApp")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      setting.inApp ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    aria-label={`${setting.label}のアプリ内通知`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.inApp ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          設定は自動的に保存されます。
        </p>
      </div>
    </div>
  );
}
