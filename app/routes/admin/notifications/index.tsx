import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect, useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { listNotifications } from "@/core/application/notification/listNotifications";
import { markAllNotificationsAsRead } from "@/core/application/notification/markAllNotificationsAsRead";
import { container } from "@/core/di/server";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import type { Route } from "./+types/index";

type NotificationItem = {
  id: string;
  type: "reservation" | "member" | "announcement";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceUrl: string | null;
};

const notificationTypeLabels: Record<NotificationItem["type"], string> = {
  reservation: "予約",
  member: "メンバー",
  announcement: "お知らせ",
};

function mapNotificationTypeToCategory(type: string): NotificationItem["type"] {
  if (type.startsWith("reservation") || type === "new_reservation") {
    return "reservation";
  }
  if (
    type === "member_joined" ||
    type === "member_left" ||
    type === "invitation_received"
  ) {
    return "member";
  }
  return "announcement";
}

const categoryToNotificationTypes: Record<string, readonly string[]> = {
  reservation: [
    "reservation_confirmed",
    "reservation_updated",
    "reservation_cancelled",
    "reservation_reminder",
    "reservation_pending",
    "reservation_approved",
    "reservation_rejected",
    "new_reservation",
    "reservation_updated_by_customer",
    "reservation_cancelled_by_customer",
  ],
  member: ["member_joined", "member_left", "invitation_received"],
  announcement: ["shift_request_submitted"],
};

const ITEMS_PER_PAGE = 20;

const markAllReadSchema = z.object({});

const handlers = {
  markAllAsRead: defineHandler({
    schema: markAllReadSchema,
    handler: async (_value, args) => {
      const session = await container.authProvider.getSession(
        args.request.headers,
      );
      if (!session) throw redirect("/admin/login");

      const members = await container.memberRepository.findByAuthUserId(
        session.user.id,
      );
      if (members.length === 0) throw redirect("/admin/login");

      await Promise.all(
        members.map((member) =>
          handleUseCase(() =>
            markAllNotificationsAsRead({
              container,
              headers: args.request.headers,
              input: { recipientType: "member", recipientId: member.id },
            }),
          ).match(
            () => undefined,
            (e) => {
              throw data({ message: e.message }, { status: e.status });
            },
          ),
        ),
      );
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await container.authProvider.getSession(request.headers);
  if (!session) throw redirect("/admin/login");

  const members = await container.memberRepository.findByAuthUserId(
    session.user.id,
  );
  if (members.length === 0) throw redirect("/admin/login");

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const page = Number(url.searchParams.get("page") ?? "1");

  const typeFilters =
    filter === "all" ? null : (categoryToNotificationTypes[filter] ?? null);

  // Aggregate notifications across all member IDs (each member belongs to a different tenant)
  const allResults = await Promise.all(
    members.map((member) =>
      handleUseCase(() =>
        listNotifications({
          container,
          headers: request.headers,
          input: {
            recipientType: "member",
            recipientId: member.id,
            typeFilter: null,
            typeFilters,
            page: 1,
            limit: ITEMS_PER_PAGE * page,
          },
        }),
      ).match(
        (r) => r,
        (e) => {
          throw data({ message: e.message }, { status: e.status });
        },
      ),
    ),
  );

  // Merge and sort all notifications by createdAt descending
  const mergedItems = allResults
    .flatMap((r) => r.items)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalCount = allResults.reduce((sum, r) => sum + r.totalCount, 0);
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = mergedItems.slice(offset, offset + ITEMS_PER_PAGE);

  const notifications: NotificationItem[] = paginatedItems.map((item) => ({
    id: item.id,
    type: mapNotificationTypeToCategory(item.type),
    title: item.title,
    message: item.message,
    isRead: item.isRead,
    createdAt: item.createdAt.toLocaleDateString("ja-JP"),
    referenceUrl:
      item.referenceType && item.referenceId
        ? `/${item.referenceType}/${item.referenceId}`
        : null,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return {
    notifications,
    filter,
    page,
    totalPages,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  };
}

export default function AdminNotificationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { notifications, filter, page, totalPages, unreadCount } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useCompositeAction<typeof handlers>();

  const [markAllForm] = useForm({
    id: "admin-mark-all-read-form",
    lastResult:
      fetcher.data?.intent === "markAllAsRead" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.markAllAsRead.schema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.markAllAsRead.schema,
      });
    },
  });

  fetcher.register("markAllAsRead", {
    onSuccess: () => {
      console.log("All marked as read");
    },
  });

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
    { id: "member", label: "メンバー関連" },
    { id: "announcement", label: "お知らせ" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">通知</h1>
        {unreadCount > 0 && (
          <fetcher.Form method="post" {...getFormProps(markAllForm)}>
            <input type="hidden" name="intent" value="markAllAsRead" />
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
              <a
                key={notification.id}
                href={notification.referenceUrl ?? "#"}
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
                        {notificationTypeLabels[notification.type]}
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
                    {notification.createdAt}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Tabs>

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/admin/notifications"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
