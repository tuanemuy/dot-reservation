import { BusinessRuleError } from "@/core/domain/error";
import { CommonErrorCode } from "./errorCode";

// Email
type Email = string & { readonly brand: "Email" };

export type { Email };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Email = {
  create: (value: string): Email => {
    if (!EMAIL_PATTERN.test(value)) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidEmail,
        "Invalid email format",
      );
    }
    return value as Email;
  },
};

// PhoneNumber
type PhoneNumber = string & { readonly brand: "PhoneNumber" };

export type { PhoneNumber };

const PHONE_NUMBER_PATTERN = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;

export const PhoneNumber = {
  create: (value: string): PhoneNumber => {
    if (!PHONE_NUMBER_PATTERN.test(value)) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidPhoneNumber,
        "Invalid phone number format",
      );
    }
    return value as PhoneNumber;
  },
};

// PostalCode
type PostalCode = string & { readonly brand: "PostalCode" };

export type { PostalCode };

const POSTAL_CODE_PATTERN = /^\d{3}-\d{4}$/;

export const PostalCode = {
  create: (value: string): PostalCode => {
    if (!POSTAL_CODE_PATTERN.test(value)) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidPostalCode,
        "Invalid postal code format (expected NNN-NNNN)",
      );
    }
    return value as PostalCode;
  },
};

// Address
export type Address = {
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
};

export const Address = {
  create: (params: {
    prefecture: string;
    city: string;
    street: string;
  }): Address => {
    if (!params.prefecture || !params.city || !params.street) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidAddress,
        "All address fields (prefecture, city, street) are required",
      );
    }
    return {
      prefecture: params.prefecture,
      city: params.city,
      street: params.street,
    };
  },
};

// TimeOfDay
type TimeOfDay = string & { readonly brand: "TimeOfDay" };

export type { TimeOfDay };

const TIME_OF_DAY_PATTERN = /^\d{2}:\d{2}$/;

export const TimeOfDay = {
  create: (value: string): TimeOfDay => {
    if (!TIME_OF_DAY_PATTERN.test(value)) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidTimeOfDay,
        "Invalid time format (expected HH:MM)",
      );
    }

    const [hours, minutes] = value.split(":").map(Number);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidTimeOfDay,
        "Invalid time value",
      );
    }

    if (minutes % 15 !== 0) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidTimeOfDay,
        "Minutes must be in 15-minute increments (00, 15, 30, 45)",
      );
    }

    return value as TimeOfDay;
  },

  compare: (a: TimeOfDay, b: TimeOfDay): number => {
    const [aHours, aMinutes] = a.split(":").map(Number);
    const [bHours, bMinutes] = b.split(":").map(Number);
    const aTotal = aHours * 60 + aMinutes;
    const bTotal = bHours * 60 + bMinutes;
    return aTotal - bTotal;
  },
};

// DayOfWeek
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const VALID_DAYS_OF_WEEK: ReadonlySet<number> = new Set([0, 1, 2, 3, 4, 5, 6]);

export const DayOfWeek = {
  create: (value: number): DayOfWeek => {
    if (!VALID_DAYS_OF_WEEK.has(value)) {
      throw new BusinessRuleError(
        CommonErrorCode.InvalidDayOfWeek,
        "Invalid day of week (expected 0-6, where 0=Sunday)",
      );
    }
    return value as DayOfWeek;
  },
};
