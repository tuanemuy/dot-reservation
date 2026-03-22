import { v7 as uuidv7 } from "uuid";
import {
  type TimeOfDay,
  TimeOfDay as TimeOfDayObj,
} from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { ShiftErrorCode } from "./errorCode";

// ShiftId
type ShiftId = string & { readonly brand: "ShiftId" };

const ShiftId = {
  create: (id: string): ShiftId => {
    return id as ShiftId;
  },
  generate: (): ShiftId => {
    return uuidv7() as ShiftId;
  },
};

export { ShiftId };

// ShiftRequestId
type ShiftRequestId = string & { readonly brand: "ShiftRequestId" };

const ShiftRequestId = {
  create: (id: string): ShiftRequestId => {
    return id as ShiftRequestId;
  },
  generate: (): ShiftRequestId => {
    return uuidv7() as ShiftRequestId;
  },
};

export { ShiftRequestId };

// RecurringGroupId
type RecurringGroupId = string & { readonly brand: "RecurringGroupId" };

const RecurringGroupId = {
  create: (id: string): RecurringGroupId => {
    return id as RecurringGroupId;
  },
  generate: (): RecurringGroupId => {
    return uuidv7() as RecurringGroupId;
  },
};

export { RecurringGroupId };

// TimeRange
type TimeRange = {
  readonly start: TimeOfDay;
  readonly end: TimeOfDay;
};

const TimeRange = {
  create: (params: { start: TimeOfDay; end: TimeOfDay }): TimeRange => {
    if (TimeOfDayObj.compare(params.start, params.end) >= 0) {
      throw new BusinessRuleError(
        ShiftErrorCode.InvalidTimeRange,
        "TimeRange start must be before end",
      );
    }
    return {
      start: params.start,
      end: params.end,
    };
  },
};

export { TimeRange };

// ShiftRequestType
type ShiftRequestType = "work" | "off";

const ShiftRequestType = {
  create: (value: string): ShiftRequestType => {
    if (value !== "work" && value !== "off") {
      throw new BusinessRuleError(
        ShiftErrorCode.InvalidShiftRequestType,
        "Invalid shift request type",
      );
    }
    return value as ShiftRequestType;
  },
};

export { ShiftRequestType };
