import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { data, redirect, useSearchParams } from "react-router";
import { z } from "zod";
import { Pagination } from "@/components/ui/Pagination";
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

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "reservation":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[oklch(0.55_0.12_145/0.1)] text-success">
          <svg
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
      );
    case "member":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[oklch(0.55_0.1_240/0.1)] text-info">
          <svg
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
      );
    case "announcement":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-lighter text-accent-dark">
          <svg
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </div>
      );
  }
}

const filterTabs = [
  { id: "all", label: "すべて" },
  { id: "reservation", label: "予約関連" },
  { id: "member", label: "メンバー関連" },
  { id: "announcement", label: "お知らせ" },
];

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

  fetcher.register("markAllAsRead", {});

  const handleFilterChange = (newFilter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", newFilter);
    params.delete("page");
    setSearchParams(params);
  };

  const isMarkingAll = fetcher.isPending("markAllAsRead");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-neutral-900">
          通知
        </h1>
        {unreadCount > 0 && (
          <fetcher.Form method="post" {...getFormProps(markAllForm)}>
            <input type="hidden" name="intent" value="markAllAsRead" />
            <button
              type="submit"
              disabled={isMarkingAll}
              className="inline-flex h-9 items-center gap-1 rounded-md bg-transparent px-4 text-sm font-medium text-neutral-500 transition-[background,color] duration-150 hover:bg-neutral-200 hover:text-neutral-800 disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isMarkingAll ? "処理中..." : "すべて既読にする"}
            </button>
          </fetcher.Form>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 flex w-fit gap-0.5 rounded-md bg-neutral-200 p-[3px]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleFilterChange(tab.id)}
            className={`whitespace-nowrap rounded-sm px-4 py-2 text-sm font-medium transition-[background,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              filter === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "bg-transparent text-neutral-600 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-neutral-300 bg-white py-12 text-center">
          <p className="text-sm text-neutral-500">通知はありません</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
          {notifications.map((notification, i) => (
            <a
              key={notification.id}
              href={notification.referenceUrl ?? "#"}
              className={`flex items-start gap-4 px-6 py-6 transition-colors duration-150 ${
                i < notifications.length - 1
                  ? "border-b border-neutral-200"
                  : ""
              } ${
                notification.isRead
                  ? "hover:bg-neutral-50"
                  : "bg-accent-lighter hover:bg-[oklch(0.97_0.02_75/0.7)]"
              }`}
            >
              <NotificationIcon type={notification.type} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-base leading-normal ${
                    notification.isRead
                      ? "font-normal text-neutral-800"
                      : "font-medium text-neutral-800"
                  }`}
                >
                  {notification.title}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {notification.createdAt}
                </p>
              </div>
              {!notification.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
              )}
            </a>
          ))}
        </div>
      )}

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
