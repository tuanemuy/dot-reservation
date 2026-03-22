import { v7 as uuidv7 } from "uuid";
import {
  type TimeOfDay,
  TimeOfDay as TimeOfDayObj,
} from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { ReservationErrorCode } from "./errorCode";

// ReservationId
type ReservationId = string & { readonly brand: "ReservationId" };

const ReservationId = {
  create: (id: string): ReservationId => {
    return id as ReservationId;
  },
  generate: (): ReservationId => {
    return uuidv7() as ReservationId;
  },
};

export { ReservationId };

// ReservationStatus
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
]);

const ReservationStatus = {
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

export { ReservationStatus };

// TimeSlot
type TimeSlot = {
  readonly date: Date;
  readonly startTime: TimeOfDay;
  readonly endTime: TimeOfDay;
};

const TimeSlot = {
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

export { TimeSlot };

// CreatedBy
export type CreatedBy = "customer" | "admin" | "staff";
