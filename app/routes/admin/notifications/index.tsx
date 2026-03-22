import { useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";

// TODO: loader で通知一覧を取得
// TODO: action で既読処理を実装

// 仮データ
const mockNotifications = [
  {
    id: "1",
    type: "reservation" as const,
    message: "新しい予約リクエストが届きました",
    createdAt: "2024-01-15 14:30",
    isRead: false,
    link: "/admin/1/reservations/1",
  },
  {
    id: "2",
    type: "member" as const,
    message: "田中さんが招待を承認しました",
    createdAt: "2024-01-14 10:00",
    isRead: false,
    link: "/admin/1/members",
  },
  {
    id: "3",
    type: "info" as const,
    message: "システムメンテナンスのお知らせ",
    createdAt: "2024-01-13 09:00",
    isRead: true,
    link: null,
  },
];

const filterLabels: Record<string, string> = {
  all: "すべて",
  reservation: "予約関連",
  member: "メンバー関連",
  info: "お知らせ",
};

export default function AdminNotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const currentFilter = searchParams.get("filter") || "all";

  const [notifications] = useState(mockNotifications);

  const filteredNotifications =
    currentFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === currentFilter);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">通知</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="markAllAsRead" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            すべて既読にする
          </button>
        </Form>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex gap-2">
        {Object.entries(filterLabels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === "all") {
                searchParams.delete("filter");
              } else {
                searchParams.set("filter", key);
              }
              setSearchParams(searchParams);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              currentFilter === key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 通知一覧 */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">通知はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 rounded-lg border bg-white p-4 ${
                notification.isRead
                  ? "border-gray-200"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  notification.type === "reservation"
                    ? "bg-green-100 text-green-600"
                    : notification.type === "member"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {notification.type === "reservation" ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ) : notification.type === "member" ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    notification.isRead
                      ? "text-gray-600"
                      : "font-medium text-gray-900"
                  }`}
                >
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.createdAt}
                </p>
              </div>
              {!notification.isRead && (
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
