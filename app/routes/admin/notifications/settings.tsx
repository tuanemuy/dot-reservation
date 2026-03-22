import { z } from "zod";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import type { Route } from "./+types/settings";

type NotificationSetting = {
  type: string;
  label: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

const updateSettingSchema = z.object({
  type: z.string().min(1),
  channel: z.enum(["email", "in_app"]),
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
});

const handlers = {
  updateSetting: defineHandler({
    schema: updateSettingSchema,
    handler: async (value, _args) => {
      // TODO: 通知設定更新ユースケースを実装
      console.log("Update admin notification setting:", value);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader(_args: Route.LoaderArgs) {
  // TODO: 認証ユーザーの管理画面通知設定を取得（ロールに応じた表示）
  const settings: NotificationSetting[] = [
    {
      type: "newReservation",
      label: "新規予約",
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      type: "reservationCancelled",
      label: "予約キャンセル",
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      type: "reservationChanged",
      label: "予約変更",
      emailEnabled: true,
      inAppEnabled: true,
    },
    {
      type: "memberJoined",
      label: "メンバー参加",
      emailEnabled: false,
      inAppEnabled: true,
    },
    {
      type: "announcement",
      label: "お知らせ",
      emailEnabled: true,
      inAppEnabled: true,
    },
  ];

  return { settings };
}

export default function AdminNotificationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("updateSetting", {
    onSuccess: () => {
      console.log("Setting updated");
    },
  });

  const handleToggle = (
    type: string,
    channel: "email" | "in_app",
    currentValue: boolean,
  ) => {
    const formData = new FormData();
    formData.set("intent", "updateSetting");
    formData.set("type", type);
    formData.set("channel", channel);
    formData.set("enabled", String(!currentValue));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">通知設定</h1>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4">
            <span className="text-sm font-medium text-text">通知種別</span>
            <span className="text-center text-sm font-medium text-text">
              メール
            </span>
            <span className="text-center text-sm font-medium text-text">
              アプリ内
            </span>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          <div className="divide-y divide-border">
            {settings.map((setting) => (
              <div
                key={setting.type}
                className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-4"
              >
                <span className="text-sm text-text">{setting.label}</span>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(setting.type, "email", setting.emailEnabled)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      setting.emailEnabled ? "bg-primary" : "bg-border"
                    }`}
                    aria-label={`${setting.label}のメール通知を${setting.emailEnabled ? "オフ" : "オン"}にする`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.emailEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(setting.type, "in_app", setting.inAppEnabled)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      setting.inAppEnabled ? "bg-primary" : "bg-border"
                    }`}
                    aria-label={`${setting.label}のアプリ内通知を${setting.inAppEnabled ? "オフ" : "オン"}にする`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        setting.inAppEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <p className="mt-4 text-sm text-text-muted">
        設定はトグルを切り替えると自動的に保存されます。
      </p>
    </div>
  );
}
