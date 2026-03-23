import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect, useSearchParams } from "react-router";
import { z } from "zod";
import { Pagination } from "@/components/ui/Pagination";
import { getUnreadNotificationCount } from "@/core/application/notification/getUnreadNotificationCount";
import type { NotificationDetail } from "@/core/application/notification/listNotifications";
import { listNotifications } from "@/core/application/notification/listNotifications";
import { markAllNotificationsAsRead } from "@/core/application/notification/markAllNotificationsAsRead";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

const ITEMS_PER_PAGE = 20;

const RESERVATION_TYPES = [
  "reservation_confirmed",
  "reservation_updated",
  "reservation_cancelled",
  "reservation_reminder",
  "reservation_pending",
  "reservation_approved",
  "reservation_rejected",
] as const;

const markAllReadSchema = z.object({
  customerId: z.string().min(1),
});

const handlers = {
  markAllAsRead: defineHandler({
    schema: markAllReadSchema,
    handler: async (value, args) => {
      const { container } = await import("@/core/di/server");

      return handleUseCase(() =>
        markAllNotificationsAsRead({
          container,
          headers: args.request.headers,
          input: {
            recipientType: "customer",
            recipientId: value.customerId,
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
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const page = Number(url.searchParams.get("page") ?? "1");

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

  // Build filter based on tab
  const typeFilters =
    filter === "reservation"
      ? RESERVATION_TYPES
      : filter === "announcement"
        ? (["announcement"] as const)
        : null;

  const result = await handleUseCase(() =>
    listNotifications({
      container,
      headers: request.headers,
      input: {
        recipientType: "customer",
        recipientId: customerId,
        typeFilter: null,
        typeFilters,
        page,
        limit: ITEMS_PER_PAGE,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const unreadResult = await handleUseCase(() =>
    getUnreadNotificationCount({
      container,
      headers: request.headers,
      input: {
        recipientType: "customer",
        recipientId: customerId,
      },
    }),
  ).match(
    (r) => r,
    () => ({ count: 0 }),
  );

  return {
    notifications: result.items,
    filter,
    page,
    totalPages: Math.ceil(result.totalCount / ITEMS_PER_PAGE),
    unreadCount: unreadResult.count,
    customerId,
  };
}

function getNotificationUrl(notification: NotificationDetail): string {
  if (
    notification.referenceType === "reservation" &&
    notification.referenceId
  ) {
    return `/mypage/reservations/${notification.referenceId}`;
  }
  return "#";
}

function getNotificationIconStyle(type: string): {
  background: string;
  color: string;
} {
  if (type.includes("confirmed") || type.includes("approved")) {
    return {
      background: "oklch(0.55 0.12 145 / 0.1)",
      color: "var(--color-success)",
    };
  }
  if (type.includes("updated") || type.includes("pending")) {
    return {
      background: "oklch(0.72 0.14 70 / 0.1)",
      color: "var(--color-warning)",
    };
  }
  if (type.includes("cancelled") || type.includes("rejected")) {
    return {
      background: "oklch(0.55 0.16 25 / 0.1)",
      color: "var(--color-error)",
    };
  }
  return {
    background: "oklch(0.55 0.10 240 / 0.1)",
    color: "var(--color-info)",
  };
}

function getNotificationIcon(type: string): React.ReactNode {
  if (type.includes("confirmed") || type.includes("approved")) {
    return (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ width: "18px", height: "18px" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  if (type.includes("updated") || type.includes("pending")) {
    return (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ width: "18px", height: "18px" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
        />
      </svg>
    );
  }
  if (type.includes("cancelled") || type.includes("rejected")) {
    return (
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ width: "18px", height: "18px" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ width: "18px", height: "18px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffDay < 14) return "1週間前";
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
  return date.toLocaleDateString("ja-JP");
}

export default function NotificationsIndexPage({
  loaderData,
}: Route.ComponentProps) {
  const { notifications, filter, page, totalPages, unreadCount, customerId } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useCompositeAction<typeof handlers>();

  const [markAllForm] = useForm({
    id: "mark-all-read-form",
    lastResult:
      fetcher.data?.intent === "markAllAsRead" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.markAllAsRead.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.markAllAsRead.schema,
      });
    },
  });

  fetcher.register("markAllAsRead", {});

  const handleFilterChange = (newFilter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", newFilter);
    params.delete("page");
    setSearchParams(params);
  };

  const isMarkingAll = fetcher.isPending("markAllAsRead");

  const tabs = [
    { id: "all", label: "すべて" },
    { id: "reservation", label: "予約関連" },
    { id: "announcement", label: "お知らせ" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "var(--space-lg)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--color-neutral-900)",
            letterSpacing: "var(--tracking-tight)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          通知
        </h1>
        {unreadCount > 0 && (
          <fetcher.Form method="post" {...getFormProps(markAllForm)}>
            <input type="hidden" name="intent" value="markAllAsRead" />
            <input type="hidden" name="customerId" value={customerId} />
            <button
              type="submit"
              disabled={isMarkingAll}
              className="inline-flex items-center"
              style={{
                gap: "var(--space-xs)",
                height: "32px",
                padding: "0 var(--space-md)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: "var(--color-neutral-600)",
                cursor: isMarkingAll ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition:
                  "background var(--transition-default), border-color var(--transition-default), color var(--transition-default)",
                opacity: isMarkingAll ? 0.5 : 1,
              }}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: "14px", height: "14px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              {isMarkingAll ? "処理中..." : "すべて既読にする"}
            </button>
          </fetcher.Form>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        className="flex"
        style={{
          borderBottom: "1px solid var(--color-neutral-300)",
          marginBottom: "var(--space-lg)",
          gap: "0",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleFilterChange(t.id)}
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              color:
                filter === t.id
                  ? "var(--color-neutral-900)"
                  : "var(--color-neutral-500)",
              position: "relative",
              transition: "color var(--transition-default)",
              cursor: "pointer",
              border: "none",
              background: "none",
              fontFamily: "inherit",
              borderBottom:
                filter === t.id
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <p
          className="py-12 text-center"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-500)",
          }}
        >
          通知はありません
        </p>
      ) : (
        <div className="flex flex-col">
          {notifications.map((notification, idx) => {
            const iconStyle = getNotificationIconStyle(notification.type);
            return (
              <Link
                key={notification.id}
                to={getNotificationUrl(notification)}
                className="flex items-start"
                style={{
                  gap: "var(--space-md)",
                  padding: "var(--space-md) var(--space-lg)",
                  borderBottom: "1px solid var(--color-neutral-200)",
                  borderTop:
                    idx === 0 ? "1px solid var(--color-neutral-200)" : "none",
                  transition: "background var(--transition-default)",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "inherit",
                  background: notification.isRead
                    ? "transparent"
                    : "var(--color-primary-lighter)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = notification.isRead
                    ? "var(--color-neutral-50)"
                    : "oklch(0.96 0.02 155 / 0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notification.isRead
                    ? "transparent"
                    : "var(--color-primary-lighter)";
                }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-md)",
                    marginTop: "2px",
                    ...iconStyle,
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Body */}
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-base)",
                      color: notification.isRead
                        ? "var(--color-neutral-700)"
                        : "var(--color-neutral-800)",
                      fontWeight: notification.isRead
                        ? "var(--weight-normal)"
                        : ("var(--weight-medium)" as string),
                      lineHeight: "var(--leading-normal)",
                    }}
                  >
                    {notification.title || notification.message}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-500)",
                      marginTop: "var(--space-xs)",
                    }}
                  >
                    {formatRelativeTime(notification.createdAt)}
                  </div>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div
                    className="shrink-0"
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-primary)",
                      marginTop: "var(--space-sm)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/mypage/notifications"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
