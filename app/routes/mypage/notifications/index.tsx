import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import type { Route } from "./+types/index";

type NotificationItem = {
  id: string;
  type: "reservation" | "announcement";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceUrl: string | null;
};

const notificationTypeLabels: Record<NotificationItem["type"], string> = {
  reservation: "予約",
  announcement: "お知らせ",
};

const markAllReadSchema = z.object({});

const handlers = {
  markAllAsRead: defineHandler({
    schema: markAllReadSchema,
    handler: async (_value, _args) => {
      // TODO: 全通知を既読にするユースケースを実装
      console.log("Mark all as read");
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const page = Number(url.searchParams.get("page") ?? "1");

  // TODO: 認証ユーザーのIDで通知一覧を取得
  const dummyNotifications: NotificationItem[] = [
    {
      id: "1",
      type: "reservation",
      title: "予約が確定しました",
      message: "サンプル美容室の予約が確定されました。",
      isRead: false,
      createdAt: "2026-03-22 14:30",
      referenceUrl: "/mypage/reservations/1",
    },
    {
      id: "2",
      type: "announcement",
      title: "システムメンテナンスのお知らせ",
      message: "3月30日にシステムメンテナンスを実施します。",
      isRead: true,
      createdAt: "2026-03-20 10:00",
      referenceUrl: null,
    },
    {
      id: "3",
      type: "reservation",
      title: "予約リマインダー",
      message: "明日10:00からのカットの予約があります。",
      isRead: false,
      createdAt: "2026-03-19 18:00",
      referenceUrl: "/mypage/reservations/1",
    },
  ];

  const filtered =
    filter === "all"
      ? dummyNotifications
      : dummyNotifications.filter((n) => n.type === filter);

  return {
    notifications: filtered,
    filter,
    page,
    totalPages: 1,
    unreadCount: dummyNotifications.filter((n) => !n.isRead).length,
  };
}

export default function NotificationsIndexPage({
  loaderData,
}: Route.ComponentProps) {
  const { notifications, filter, page, totalPages, unreadCount } = loaderData;
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
          baseUrl="/mypage/notifications"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
