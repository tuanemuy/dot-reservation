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
        className="size-[18px]"
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
        className="size-[18px]"
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
        className="size-[18px]"
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
      className="size-[18px]"
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-semibold text-neutral-900 tracking-tight leading-tight">
          通知
        </h1>
        {unreadCount > 0 && (
          <fetcher.Form method="post" {...getFormProps(markAllForm)}>
            <input type="hidden" name="intent" value="markAllAsRead" />
            <input type="hidden" name="customerId" value={customerId} />
            <button
              type="submit"
              disabled={isMarkingAll}
              className={`inline-flex items-center gap-1 h-8 px-4 bg-white border border-neutral-300 rounded-md text-sm font-medium text-neutral-600 font-[inherit] duration-150 ${isMarkingAll ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-[14px]"
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
      <div className="flex border-b border-neutral-300 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleFilterChange(t.id)}
            className={`py-2 px-6 text-base font-medium relative duration-150 cursor-pointer border-none bg-none font-[inherit] -mb-px ${
              filter === t.id
                ? "text-neutral-900 border-b-2 border-b-primary"
                : "text-neutral-500 border-b-2 border-b-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">
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
                className={`flex items-start gap-4 py-4 px-6 cursor-pointer no-underline text-[inherit] transition-colors duration-150 ${notification.isRead ? "bg-transparent hover:bg-neutral-50" : "bg-primary-lighter hover:bg-primary-lighter/70"} ${idx === 0 ? "border-t border-t-neutral-200" : ""} border-b border-b-neutral-200`}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center shrink-0 size-9 rounded-md mt-[2px]"
                  style={iconStyle}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-base leading-normal ${notification.isRead ? "text-neutral-700 font-normal" : "text-neutral-800 font-medium"}`}
                  >
                    {notification.title || notification.message}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </div>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="shrink-0 size-2 rounded-full bg-primary mt-2" />
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
