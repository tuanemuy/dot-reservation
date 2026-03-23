import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, Link, redirect, useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
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

const notificationTypeLabels: Record<string, string> = {
  reservation_confirmed: "予約",
  reservation_updated: "予約",
  reservation_cancelled: "予約",
  reservation_reminder: "予約",
  reservation_pending: "予約",
  reservation_approved: "予約",
  reservation_rejected: "予約",
};

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

  // 通知タイプフィルター: "all" の場合は null
  const typeFilter =
    filter === "all"
      ? null
      : filter === "reservation"
        ? "reservation_confirmed"
        : null;

  const result = await handleUseCase(() =>
    listNotifications({
      container,
      headers: request.headers,
      input: {
        recipientType: "customer",
        recipientId: customerId,
        typeFilter,
        typeFilters: null,
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">通知</h1>
        {unreadCount > 0 && (
          <fetcher.Form method="post" {...getFormProps(markAllForm)}>
            <input type="hidden" name="intent" value="markAllAsRead" />
            <input type="hidden" name="customerId" value={customerId} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isMarkingAll}
            >
              {isMarkingAll ? "処理中..." : "すべて既読にする"}
            </Button>
          </fetcher.Form>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={filter} onTabChange={handleFilterChange}>
        {notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-muted">
            通知はありません
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationUrl(notification)}
                className={`block rounded-lg border p-4 transition-colors ${
                  notification.isRead
                    ? "border-border bg-white"
                    : "border-border bg-surface-secondary"
                } hover:bg-surface-secondary`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {!notification.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      )}
                      <span className="text-xs text-text-muted">
                        {notificationTypeLabels[notification.type] ??
                          "お知らせ"}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${notification.isRead ? "text-text-secondary" : "font-medium text-text"}`}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {notification.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-muted">
                    {notification.createdAt.toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Tabs>

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
