import { data, redirect } from "react-router";
import { z } from "zod";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getNotificationPreferences } from "@/core/application/notification/getNotificationPreferences";
import { updateNotificationPreference } from "@/core/application/notification/updateNotificationPreference";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/settings";

type NotificationSetting = {
  type: string;
  label: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

const CUSTOMER_NOTIFICATION_TYPES: ReadonlyArray<{
  type: string;
  label: string;
}> = [
  { type: "reservation_confirmed", label: "予約確定" },
  { type: "reservation_updated", label: "予約変更" },
  { type: "reservation_cancelled", label: "予約キャンセル" },
  { type: "reservation_reminder", label: "予約リマインダー" },
  { type: "reservation_approved", label: "予約承認" },
  { type: "reservation_rejected", label: "予約却下" },
];

const updateSettingSchema = z.object({
  customerId: z.string().min(1),
  type: z.string().min(1),
  channel: z.enum(["email", "in_app"]),
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
});

const handlers = {
  updateSetting: defineHandler({
    schema: updateSettingSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        updateNotificationPreference({
          container,
          headers: args.request.headers,
          input: {
            recipientType: "customer",
            recipientId: value.customerId,
            channel: value.channel,
            type: value.type,
            enabled: value.enabled,
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

export async function loader({ request }: Route.LoaderArgs) {
  const { container } = await import("@/core/di/server");

  const session = await container.authProvider.getSession(request.headers);
  if (!session) {
    throw redirect("/customer/login");
  }
  const customer = await container.customerRepository.findByAuthUserId(
    session.user.id,
  );
  if (!customer) {
    throw redirect("/customer/setup");
  }
  const customerId = customer.id;

  const result = await handleUseCase(() =>
    getNotificationPreferences({
      container,
      headers: request.headers,
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // 顧客向けの通知タイプのみをフィルタリングして整形
  const settings: NotificationSetting[] = CUSTOMER_NOTIFICATION_TYPES.map(
    ({ type, label }) => {
      const emailPref = result.preferences.find(
        (p) => p.channel === "email" && p.type === type,
      );
      const inAppPref = result.preferences.find(
        (p) => p.channel === "in_app" && p.type === type,
      );
      return {
        type,
        label,
        emailEnabled: emailPref?.enabled ?? true,
        inAppEnabled: inAppPref?.enabled ?? true,
      };
    },
  );

  return { settings, customerId };
}

export default function NotificationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings, customerId } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("updateSetting", {});

  const handleToggle = (
    type: string,
    channel: "email" | "in_app",
    currentValue: boolean,
  ) => {
    const formData = new FormData();
    formData.set("intent", "updateSetting");
    formData.set("customerId", customerId);
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
