import { data, redirect } from "react-router";
import { z } from "zod";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getNotificationPreferences } from "@/core/application/notification/getNotificationPreferences";
import { updateNotificationPreference } from "@/core/application/notification/updateNotificationPreference";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
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

const updateSettingSchema = z.object({
  type: z.string().min(1),
  channel: z.enum(["email", "in_app"]),
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
});

const handlers = {
  updateSetting: defineHandler({
    schema: updateSettingSchema,
    handler: async (value, args) => {
      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) throw redirect("/admin/login");

      const members = await container.memberRepository.findByAuthUserId(
        session.user.id,
      );
      if (members.length === 0) throw redirect("/admin/login");

      const memberId = members[0]?.id;

      await handleUseCase(() =>
        updateNotificationPreference({
          container,
          headers: args.request.headers,
          input: {
            recipientType: "member",
            recipientId: memberId,
            type: value.type,
            channel: value.channel,
            enabled: value.enabled,
          },
        }),
      ).match(
        () => undefined,
        (e) => {
          throw data({ message: e.message }, { status: e.status });
        },
      );
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

const notificationTypeLabels: Record<string, string> = {
  new_reservation: "新規予約",
  reservation_confirmed: "予約確認",
  reservation_updated: "予約変更",
  reservation_cancelled: "予約キャンセル",
  reservation_reminder: "予約リマインダー",
  reservation_pending: "予約承認待ち",
  reservation_approved: "予約承認",
  reservation_rejected: "予約拒否",
  reservation_updated_by_customer: "顧客による予約変更",
  reservation_cancelled_by_customer: "顧客による予約キャンセル",
  invitation_received: "招待受信",
  member_joined: "メンバー参加",
  member_left: "メンバー退出",
  shift_request_submitted: "シフト申請",
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await container.authProvider.getSession(request.headers);
  if (!session) throw redirect("/admin/login");

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  if (members.length === 0) throw redirect("/admin/login");

  const memberId = members[0]?.id;

  const result = await handleUseCase(() =>
    getNotificationPreferences({
      container,
      headers: request.headers,
      input: {
        recipientType: "member",
        recipientId: memberId,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // Group preferences by type, combining email and in_app channels
  const typeMap = new Map<
    string,
    { emailEnabled: boolean; inAppEnabled: boolean }
  >();
  for (const pref of result.preferences) {
    const existing = typeMap.get(pref.type) ?? {
      emailEnabled: true,
      inAppEnabled: true,
    };
    if (pref.channel === "email") {
      existing.emailEnabled = pref.enabled;
    } else if (pref.channel === "in_app") {
      existing.inAppEnabled = pref.enabled;
    }
    typeMap.set(pref.type, existing);
  }

  const settings: NotificationSetting[] = [];
  const seenTypes = new Set<string>();
  for (const pref of result.preferences) {
    if (seenTypes.has(pref.type)) continue;
    seenTypes.add(pref.type);
    const channels = typeMap.get(pref.type) as {
      emailEnabled: boolean;
      inAppEnabled: boolean;
    };
    settings.push({
      type: pref.type,
      label: notificationTypeLabels[pref.type] ?? pref.type,
      emailEnabled: channels.emailEnabled,
      inAppEnabled: channels.inAppEnabled,
    });
  }

  return { settings };
}

export default function AdminNotificationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("updateSetting", {});

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
