export const CustomerErrorCode = {
  DisplayNameEmpty: "CUSTOMER_DISPLAY_NAME_EMPTY",
  DisplayNameTooLong: "CUSTOMER_DISPLAY_NAME_TOO_LONG",
  InvalidStatus: "CUSTOMER_INVALID_STATUS",
  AlreadySuspended: "CUSTOMER_ALREADY_SUSPENDED",
  AlreadyActive: "CUSTOMER_ALREADY_ACTIVE",
} as const;

export type CustomerErrorCode =
  (typeof CustomerErrorCode)[keyof typeof CustomerErrorCode];
