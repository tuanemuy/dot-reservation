const TenantErrorCode = {
  NameEmpty: "TENANT_NAME_EMPTY",
  NameTooLong: "TENANT_NAME_TOO_LONG",
  CategoryEmpty: "TENANT_CATEGORY_EMPTY",
  CategoryTooLong: "TENANT_CATEGORY_TOO_LONG",
  UrlPathInvalid: "TENANT_URL_PATH_INVALID",
  UrlPathTooShort: "TENANT_URL_PATH_TOO_SHORT",
  UrlPathTooLong: "TENANT_URL_PATH_TOO_LONG",
  DescriptionTooLong: "TENANT_DESCRIPTION_TOO_LONG",
  InvalidStatus: "TENANT_INVALID_STATUS",
  InvalidBusinessHours: "TENANT_INVALID_BUSINESS_HOURS",
  InvalidTemporaryHoliday: "TENANT_INVALID_TEMPORARY_HOLIDAY",
  DuplicateTemporaryHoliday: "TENANT_DUPLICATE_TEMPORARY_HOLIDAY",
  TemporaryHolidayNotFound: "TENANT_TEMPORARY_HOLIDAY_NOT_FOUND",
  InvalidReservationSettings: "TENANT_INVALID_RESERVATION_SETTINGS",
  InvalidApprovalMethod: "TENANT_INVALID_APPROVAL_METHOD",
  TooManyImages: "TENANT_TOO_MANY_IMAGES",
  AlreadyActive: "TENANT_ALREADY_ACTIVE",
  AlreadySuspended: "TENANT_ALREADY_SUSPENDED",
} as const;

type TenantErrorCode = (typeof TenantErrorCode)[keyof typeof TenantErrorCode];

export { TenantErrorCode };
