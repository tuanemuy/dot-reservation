import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";
import { z } from "zod";
import { getNotificationPreferences } from "@/core/application/notification/getNotificationPreferences";
import { updateNotificationPreference } from "@/core/application/notification/updateNotificationPreference";
import {
  createCompositeAction,
  defineHandler,
  error,
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

const CUSTOMER_NOTIFICATION_TYPES: ReadonlyArray<{
  type: string;
  label: string;
  description: string;
}> = [
  {
    type: "reservation_confirmed",
    label: "予約確定",
    description: "予約が確定された際に通知を受け取ります",
  },
  {
    type: "reservation_updated",
    label: "予約変更",
    description: "予約内容が変更された際に通知を受け取ります",
  },
  {
    type: "reservation_cancelled",
    label: "予約キャンセル",
    description: "予約がキャンセルされた際に通知を受け取ります",
  },
  {
    type: "reservation_reminder",
    label: "予約リマインダー",
    description: "予約日が近づいた際にリマインダーを受け取ります",
  },
  {
    type: "announcement",
    label: "お知らせ",
    description: "サービスに関するお知らせや更新情報を受け取ります",
  },
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

  const settings: NotificationSetting[] = CUSTOMER_NOTIFICATION_TYPES.map(
    ({ type, label, description }) => {
      const emailPref = result.preferences.find(
        (p) => p.channel === "email" && p.type === type,
      );
      const inAppPref = result.preferences.find(
        (p) => p.channel === "in_app" && p.type === type,
      );
      return {
        type,
        label,
        description,
        emailEnabled: emailPref?.enabled ?? true,
        inAppEnabled: inAppPref?.enabled ?? true,
      };
    },
  );

  return { settings, customerId };
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

function SettingRow({
  setting,
  customerId,
  isLast,
}: {
  setting: NotificationSetting;
  customerId: string;
  isLast: boolean;
}) {
  const emailFetcher = useFetcher();
  const inAppFetcher = useFetcher();

  const [emailReverted, setEmailReverted] = useState<boolean | null>(null);
  const [inAppReverted, setInAppReverted] = useState<boolean | null>(null);

  // Derive displayed state: optimistic while submitting, server data otherwise
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
  // This runs after loader revalidation brings fresh data
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
    formData.set("customerId", customerId);
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 140px",
        gap: "0",
        padding: "var(--space-lg) var(--space-xl)",
        borderBottom: isLast ? "none" : "1px solid var(--color-neutral-200)",
        alignItems: "center",
        transition: "background var(--transition-default)",
      }}
    >
      <div className="flex flex-col" style={{ gap: "var(--space-xs)" }}>
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-neutral-800)",
          }}
        >
          {setting.label}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-neutral-500)",
          }}
        >
          {setting.description}
        </div>
      </div>
      <div className="flex justify-center">
        <label className="mypage-toggle">
          <input
            type="checkbox"
            checked={emailDisplayed}
            onChange={() => handleToggle("email", emailDisplayed)}
            aria-label={`${setting.label}のメール通知`}
          />
          <span className="mypage-toggle-slider" />
        </label>
      </div>
      <div className="flex justify-center">
        <label className="mypage-toggle">
          <input
            type="checkbox"
            checked={inAppDisplayed}
            onChange={() => handleToggle("in_app", inAppDisplayed)}
            aria-label={`${setting.label}のアプリ内通知`}
          />
          <span className="mypage-toggle-slider" />
        </label>
      </div>
    </div>
  );
}

export default function NotificationSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings, customerId } = loaderData;

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
          marginBottom: "var(--space-sm)",
        }}
      >
        通知設定
      </h1>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-neutral-500)",
          marginBottom: "var(--space-xl)",
        }}
      >
        通知の受信方法をカテゴリごとに設定できます。
      </p>

      {/* Settings Table */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-neutral-300)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 140px",
            gap: "0",
            padding: "var(--space-md) var(--space-xl)",
            background: "var(--color-neutral-100)",
            borderBottom: "1px solid var(--color-neutral-300)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-neutral-600)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            カテゴリ
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-neutral-600)",
              letterSpacing: "var(--tracking-wide)",
              textAlign: "center",
            }}
          >
            メール通知
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--color-neutral-600)",
              letterSpacing: "var(--tracking-wide)",
              textAlign: "center",
            }}
          >
            アプリ内通知
          </div>
        </div>

        {/* Rows */}
        {settings.map((setting, idx) => (
          <SettingRow
            key={setting.type}
            setting={setting}
            customerId={customerId}
            isLast={idx === settings.length - 1}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: "var(--space-lg)",
          fontSize: "var(--text-sm)",
          color: "var(--color-neutral-500)",
        }}
      >
        設定はトグルを切り替えると自動的に保存されます。
      </p>
    </div>
  );
}
