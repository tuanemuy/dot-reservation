import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";
import { z } from "zod";
import { getNotificationPreferences } from "@/core/application/notification/getNotificationPreferences";
import { updateNotificationPreference } from "@/core/application/notification/updateNotificationPreference";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/settings";

type NotificationSetting = {
  type: string;
  label: string;
  description: string;
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

const notificationTypeInfo: Record<
  string,
  { label: string; description: string }
> = {
  new_reservation: {
    label: "新規予約",
    description: "新しい予約が入った際に通知を受け取ります",
  },
  reservation_confirmed: {
    label: "予約確認",
    description: "予約が確認された際に通知を受け取ります",
  },
  reservation_updated: {
    label: "予約変更",
    description: "予約内容が変更された際に通知を受け取ります",
  },
  reservation_cancelled: {
    label: "予約キャンセル",
    description: "予約がキャンセルされた際に通知を受け取ります",
  },
  reservation_reminder: {
    label: "予約リマインダー",
    description: "予約の事前リマインダーを受け取ります",
  },
  reservation_pending: {
    label: "予約承認待ち",
    description: "承認待ちの予約が発生した際に通知を受け取ります",
  },
  reservation_approved: {
    label: "予約承認",
    description: "予約が承認された際に通知を受け取ります",
  },
  reservation_rejected: {
    label: "予約拒否",
    description: "予約が拒否された際に通知を受け取ります",
  },
  reservation_updated_by_customer: {
    label: "顧客による予約変更",
    description: "顧客が予約を変更した際に通知を受け取ります",
  },
  reservation_cancelled_by_customer: {
    label: "顧客による予約キャンセル",
    description: "顧客が予約をキャンセルした際に通知を受け取ります",
  },
  invitation_received: {
    label: "招待受信",
    description: "新しい招待を受信した際に通知を受け取ります",
  },
  member_joined: {
    label: "メンバー参加",
    description: "新しいメンバーが参加した際に通知を受け取ります",
  },
  member_left: {
    label: "メンバー退出",
    description: "メンバーが退出した際に通知を受け取ります",
  },
  shift_request_submitted: {
    label: "シフト申請",
    description: "シフト希望が提出された際に通知を受け取ります",
  },
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
    const info = notificationTypeInfo[pref.type] ?? {
      label: pref.type,
      description: "",
    };
    settings.push({
      type: pref.type,
      label: info.label,
      description: info.description,
      emailEnabled: channels.emailEnabled,
      inAppEnabled: channels.inAppEnabled,
    });
  }

  return { settings };
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <label className="relative inline-block h-6 w-11 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer h-0 w-0 opacity-0"
        aria-label={ariaLabel}
      />
      <span className="absolute inset-0 rounded-full bg-neutral-300 transition-colors duration-[0.15s] ease-[ease] before:absolute before:bottom-[3px] before:left-[3px] before:h-[18px] before:w-[18px] before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:duration-[0.15s] before:ease-[ease] peer-checked:bg-primary peer-checked:before:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
    </label>
  );
}

/**
 * Derives the optimistic (displayed) value for a setting toggle.
 *
 * If a fetcher is currently submitting for this setting+channel,
 * we show the value being submitted (optimistic).
 * Otherwise we show the server data.
 */
function useOptimisticToggle(
  serverValue: boolean,
  settingType: string,
  channel: "email" | "in_app",
  fetcher: ReturnType<typeof useFetcher>,
): boolean {
  const isSubmittingThis =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("type") === settingType &&
    fetcher.formData?.get("channel") === channel;

  if (isSubmittingThis) {
    return fetcher.formData?.get("enabled") === "true";
  }
  return serverValue;
}

function AdminSettingRow({
  setting,
  isLast,
}: {
  setting: NotificationSetting;
  isLast: boolean;
}) {
  const emailFetcher = useFetcher();
  const inAppFetcher = useFetcher();

  const [emailReverted, setEmailReverted] = useState<boolean | null>(null);
  const [inAppReverted, setInAppReverted] = useState<boolean | null>(null);

  const emailDisplayed = useOptimisticToggle(
    emailReverted ?? setting.emailEnabled,
    setting.type,
    "email",
    emailFetcher,
  );
  const inAppDisplayed = useOptimisticToggle(
    inAppReverted ?? setting.inAppEnabled,
    setting.type,
    "in_app",
    inAppFetcher,
  );

  // Clear revert state when server data changes (successful revalidation)
  if (emailReverted !== null && emailFetcher.state === "idle") {
    setEmailReverted(null);
  }
  if (inAppReverted !== null && inAppFetcher.state === "idle") {
    setInAppReverted(null);
  }

  const handleToggle = (channel: "email" | "in_app", currentValue: boolean) => {
    const fetcher = channel === "email" ? emailFetcher : inAppFetcher;
    const formData = new FormData();
    formData.set("intent", "updateSetting");
    formData.set("type", setting.type);
    formData.set("channel", channel);
    formData.set("enabled", String(!currentValue));
    fetcher.submit(formData, { method: "post" });
  };

  // Detect failed submissions and revert
  if (
    emailFetcher.state === "idle" &&
    emailFetcher.data &&
    typeof emailFetcher.data === "object" &&
    "status" in emailFetcher.data &&
    emailFetcher.data.status === "error" &&
    emailReverted === null
  ) {
    setEmailReverted(setting.emailEnabled);
  }

  if (
    inAppFetcher.state === "idle" &&
    inAppFetcher.data &&
    typeof inAppFetcher.data === "object" &&
    "status" in inAppFetcher.data &&
    inAppFetcher.data.status === "error" &&
    inAppReverted === null
  ) {
    setInAppReverted(setting.inAppEnabled);
  }

  return (
    <tr
      className={`transition-colors duration-[0.15s] ease-[ease] hover:bg-neutral-50 ${
        !isLast ? "border-b border-neutral-200" : ""
      }`}
    >
      <td className="px-[var(--space-lg)] py-[var(--space-md)]">
        <div className="text-[length:var(--text-base)] font-[var(--weight-medium)] text-neutral-800">
          {setting.label}
        </div>
        {setting.description && (
          <div className="mt-0.5 text-[length:var(--text-xs)] text-neutral-500">
            {setting.description}
          </div>
        )}
      </td>
      <td className="px-[var(--space-lg)] py-[var(--space-md)] text-center">
        <ToggleSwitch
          checked={emailDisplayed}
          onChange={() => handleToggle("email", emailDisplayed)}
          ariaLabel={`${setting.label}のメール通知を${emailDisplayed ? "オフ" : "オン"}にする`}
        />
      </td>
      <td className="px-[var(--space-lg)] py-[var(--space-md)] text-center">
        <ToggleSwitch
          checked={inAppDisplayed}
          onChange={() => handleToggle("in_app", inAppDisplayed)}
          ariaLabel={`${setting.label}のアプリ内通知を${inAppDisplayed ? "オフ" : "オン"}にする`}
        />
      </td>
    </tr>
  );
}

export default function AdminNotificationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings } = loaderData;

  return (
    <div>
      <div className="mb-[var(--space-xl)]">
        <h1 className="font-[var(--font-heading)] text-[length:var(--text-2xl)] font-[var(--weight-semibold)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-neutral-900">
          通知設定
        </h1>
        <p className="mt-[var(--space-xs)] text-[length:var(--text-sm)] text-neutral-500">
          通知の受信方法を設定します
        </p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-neutral-300 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-lg)] pb-[var(--space-md)] text-left text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                通知カテゴリ
              </th>
              <th className="w-[140px] border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-lg)] pb-[var(--space-md)] text-center text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                メール通知
              </th>
              <th className="w-[140px] border-b border-neutral-200 px-[var(--space-lg)] py-[var(--space-lg)] pb-[var(--space-md)] text-center text-[length:var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--tracking-wide)] text-neutral-500">
                アプリ内通知
              </th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting, i) => (
              <AdminSettingRow
                key={setting.type}
                setting={setting}
                isLast={i === settings.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-[var(--space-md)] text-[length:var(--text-sm)] text-neutral-500">
        設定はトグルを切り替えると自動的に保存されます。
      </p>
    </div>
  );
}
