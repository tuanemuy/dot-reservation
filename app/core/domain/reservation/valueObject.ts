import { v7 as uuidv7 } from "uuid";
import {
  type TimeOfDay,
  TimeOfDay as TimeOfDayObj,
} from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { ReservationErrorCode } from "./errorCode";

// ReservationId
type ReservationId = string & { readonly brand: "ReservationId" };

export type { ReservationId };

export const ReservationId = {
  create: (id: string): ReservationId => {
    return id as ReservationId;
  },
  generate: (): ReservationId => {
    return uuidv7() as ReservationId;
  },
};

// ReservationStatus
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export type { ReservationStatus };

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
]);

export const ReservationStatus = {
  create: (value: string): ReservationStatus => {
    if (!VALID_STATUSES.has(value)) {
      throw new BusinessRuleError(
        ReservationErrorCode.InvalidStatus,
        "Invalid reservation status",
      );
    }
    return value as ReservationStatus;
  },
};

// TimeSlot
export type TimeSlot = {
  readonly date: Date;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
};

export const TimeSlot = {
  create: (params: {
    date: Date;
    startTime: TimeOfDay;
    endTime: TimeOfDay;
  }): TimeSlot => {
    if (TimeOfDayObj.compare(params.startTime, params.endTime) >= 0) {
      throw new BusinessRuleError(
        ReservationErrorCode.InvalidTimeSlot,
        "TimeSlot startTime must be before endTime",
      );
    }
    return {
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
    };
  },
};

// CreatedBy
export type CreatedBy = "customer" | "admin" | "staff";
