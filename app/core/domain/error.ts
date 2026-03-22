import { AnyError } from "@/lib/error";
import { CommonErrorCode } from "./common/errorCode";
import { CustomerErrorCode } from "./customer/errorCode";
import { MemberErrorCode } from "./member/errorCode";
import { MenuErrorCode } from "./menu/errorCode";
import { NotificationErrorCode } from "./notification/errorCode";
import { ReservationErrorCode } from "./reservation/errorCode";
import { ShiftErrorCode } from "./shift/errorCode";
import { StaffErrorCode } from "./staff/errorCode";
import { TenantErrorCode } from "./tenant/errorCode";

export const BusinessRuleErrorCode = {
  ...CommonErrorCode,
  ...CustomerErrorCode,
  ...MemberErrorCode,
  ...MenuErrorCode,
  ...NotificationErrorCode,
  ...ReservationErrorCode,
  ...ShiftErrorCode,
  ...StaffErrorCode,
  ...TenantErrorCode,
};

export type BusinessRuleErrorCode =
  (typeof BusinessRuleErrorCode)[keyof typeof BusinessRuleErrorCode];

/**
 * Domain Layer - Business Rule Error
 *
 * Represents a violation of business rules in the domain layer.
 * This error is thrown when domain logic determines that an operation cannot proceed.
 */
export class BusinessRuleError extends AnyError {
  override readonly name = "BusinessRuleError";

  constructor(
    public readonly code: BusinessRuleErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export function isBusinessRuleError(
  error: unknown,
): error is BusinessRuleError {
  return error instanceof BusinessRuleError;
}
