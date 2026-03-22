export const NotificationErrorCode = {
  AlreadyRead: "NOTIFICATION_ALREADY_READ",
} as const;

export type NotificationErrorCode =
  (typeof NotificationErrorCode)[keyof typeof NotificationErrorCode];
