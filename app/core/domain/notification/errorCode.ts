const NotificationErrorCode = {
  AlreadyRead: "NOTIFICATION_ALREADY_READ",
  InvalidRecipientType: "NOTIFICATION_INVALID_RECIPIENT_TYPE",
  InvalidChannel: "NOTIFICATION_INVALID_CHANNEL",
  InvalidNotificationType: "NOTIFICATION_INVALID_NOTIFICATION_TYPE",
} as const;

type NotificationErrorCode =
  (typeof NotificationErrorCode)[keyof typeof NotificationErrorCode];

export { NotificationErrorCode };
