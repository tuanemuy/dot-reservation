import { v7 as uuidv7 } from "uuid";
import type { DayOfWeek, TimeOfDay } from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { TenantErrorCode } from "./errorCode";

const TENANT_NAME_MAX_LENGTH = 100;
const TENANT_CATEGORY_MAX_LENGTH = 50;
const TENANT_URL_PATH_MIN_LENGTH = 3;
const TENANT_URL_PATH_MAX_LENGTH = 50;
const TENANT_DESCRIPTION_MAX_LENGTH = 5000;
const TENANT_MAX_IMAGES = 10;

// TenantId
type TenantId = string & { readonly brand: "TenantId" };

export type { TenantId };

export const TenantId = {
  create: (id: string): TenantId => {
    return id as TenantId;
  },
  generate: (): TenantId => {
    return uuidv7() as TenantId;
  },
};

// TenantName
type TenantName = string & { readonly brand: "TenantName" };

export type { TenantName };

export const TenantName = {
  create: (value: string): TenantName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        TenantErrorCode.NameEmpty,
        "Tenant name cannot be empty",
      );
    }
    if (value.length > TENANT_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        TenantErrorCode.NameTooLong,
        `Tenant name must be ${TENANT_NAME_MAX_LENGTH} characters or less`,
      );
    }
    return value as TenantName;
  },
  maxLength: TENANT_NAME_MAX_LENGTH,
};

// TenantCategory
type TenantCategory = string & { readonly brand: "TenantCategory" };

export type { TenantCategory };

export const TenantCategory = {
  create: (value: string): TenantCategory => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        TenantErrorCode.CategoryEmpty,
        "Tenant category cannot be empty",
      );
    }
    if (value.length > TENANT_CATEGORY_MAX_LENGTH) {
      throw new BusinessRuleError(
        TenantErrorCode.CategoryTooLong,
        `Tenant category must be ${TENANT_CATEGORY_MAX_LENGTH} characters or less`,
      );
    }
    return value as TenantCategory;
  },
  maxLength: TENANT_CATEGORY_MAX_LENGTH,
};

// TenantUrlPath
type TenantUrlPath = string & { readonly brand: "TenantUrlPath" };

export type { TenantUrlPath };

const URL_PATH_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const TenantUrlPath = {
  create: (value: string): TenantUrlPath => {
    if (value.length < TENANT_URL_PATH_MIN_LENGTH) {
      throw new BusinessRuleError(
        TenantErrorCode.UrlPathTooShort,
        `URL path must be at least ${TENANT_URL_PATH_MIN_LENGTH} characters`,
      );
    }
    if (value.length > TENANT_URL_PATH_MAX_LENGTH) {
      throw new BusinessRuleError(
        TenantErrorCode.UrlPathTooLong,
        `URL path must be ${TENANT_URL_PATH_MAX_LENGTH} characters or less`,
      );
    }
    if (!URL_PATH_PATTERN.test(value)) {
      throw new BusinessRuleError(
        TenantErrorCode.UrlPathInvalid,
        "URL path must contain only lowercase alphanumeric characters and hyphens",
      );
    }
    return value as TenantUrlPath;
  },
  minLength: TENANT_URL_PATH_MIN_LENGTH,
  maxLength: TENANT_URL_PATH_MAX_LENGTH,
};

// TenantDescription
type TenantDescription = string & { readonly brand: "TenantDescription" };

export type { TenantDescription };

export const TenantDescription = {
  create: (value: string): TenantDescription => {
    if (value.length > TENANT_DESCRIPTION_MAX_LENGTH) {
      throw new BusinessRuleError(
        TenantErrorCode.DescriptionTooLong,
        `Description must be ${TENANT_DESCRIPTION_MAX_LENGTH} characters or less`,
      );
    }
    return value as TenantDescription;
  },
  maxLength: TENANT_DESCRIPTION_MAX_LENGTH,
};

// TenantStatus
type TenantStatus = "active" | "suspended";

export type { TenantStatus };

export const TenantStatus = {
  create: (value: string): TenantStatus => {
    if (value !== "active" && value !== "suspended") {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidStatus,
        "Invalid tenant status",
      );
    }
    return value as TenantStatus;
  },
  isActive: (status: TenantStatus): status is "active" => status === "active",
  isSuspended: (status: TenantStatus): status is "suspended" =>
    status === "suspended",
};

// DailyHours
export type DailyHours = {
  readonly open: TimeOfDay;
  readonly close: TimeOfDay;
} | null;

// BusinessHours
export type BusinessHours = Readonly<Record<DayOfWeek, DailyHours>>;

export const BusinessHours = {
  create: (hours: Record<number, DailyHours>): BusinessHours => {
    for (const key of [0, 1, 2, 3, 4, 5, 6] as const) {
      if (!(key in hours)) {
        throw new BusinessRuleError(
          TenantErrorCode.InvalidBusinessHours,
          `Business hours must be defined for all days of the week (missing day ${key})`,
        );
      }
    }
    return hours as BusinessHours;
  },
};

// TemporaryHoliday
export type TemporaryHoliday = {
  readonly date: Date;
  readonly reason: string | null;
};

export const TemporaryHoliday = {
  create: (params: { date: Date; reason: string | null }): TemporaryHoliday => {
    return {
      date: params.date,
      reason: params.reason,
    };
  },
};

// ApprovalMethod
type ApprovalMethod = "auto" | "manual";

export type { ApprovalMethod };

export const ApprovalMethod = {
  create: (value: string): ApprovalMethod => {
    if (value !== "auto" && value !== "manual") {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidApprovalMethod,
        "Invalid approval method",
      );
    }
    return value as ApprovalMethod;
  },
};

// ReservationSettings
export type ReservationSettings = {
  readonly bookingWindowDays: number;
  readonly bookingDeadlineHours: number;
  readonly cancellationDeadlineHours: number;
  readonly slotDurationMinutes: number;
  readonly bufferMinutes: number;
  readonly approvalMethod: ApprovalMethod;
};

export const ReservationSettings = {
  create: (params: {
    bookingWindowDays: number;
    bookingDeadlineHours: number;
    cancellationDeadlineHours: number;
    slotDurationMinutes: number;
    bufferMinutes: number;
    approvalMethod: string;
  }): ReservationSettings => {
    if (params.bookingWindowDays < 1) {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidReservationSettings,
        "Booking window days must be at least 1",
      );
    }
    if (params.bookingDeadlineHours < 0) {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidReservationSettings,
        "Booking deadline hours must be non-negative",
      );
    }
    if (params.cancellationDeadlineHours < 0) {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidReservationSettings,
        "Cancellation deadline hours must be non-negative",
      );
    }
    if (params.slotDurationMinutes < 1) {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidReservationSettings,
        "Slot duration minutes must be at least 1",
      );
    }
    if (params.bufferMinutes < 0) {
      throw new BusinessRuleError(
        TenantErrorCode.InvalidReservationSettings,
        "Buffer minutes must be non-negative",
      );
    }

    return {
      bookingWindowDays: params.bookingWindowDays,
      bookingDeadlineHours: params.bookingDeadlineHours,
      cancellationDeadlineHours: params.cancellationDeadlineHours,
      slotDurationMinutes: params.slotDurationMinutes,
      bufferMinutes: params.bufferMinutes,
      approvalMethod: ApprovalMethod.create(params.approvalMethod),
    };
  },
};

// ImageUrls validation
export const ImageUrls = {
  validate: (urls: string[]): string[] => {
    if (urls.length > TENANT_MAX_IMAGES) {
      throw new BusinessRuleError(
        TenantErrorCode.TooManyImages,
        `Maximum ${TENANT_MAX_IMAGES} images allowed`,
      );
    }
    return urls;
  },
  maxCount: TENANT_MAX_IMAGES,
};
