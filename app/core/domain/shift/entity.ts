import type { WithEvents } from "@/core/domain/common/event";
import type { TimeOfDay } from "@/core/domain/common/valueObject";
import { TimeOfDay as TimeOfDayObj } from "@/core/domain/common/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import { type ShiftEvent, ShiftEvents } from "./events";
import type {
  RecurringGroupId as RecurringGroupIdType,
  ShiftId as ShiftIdType,
  ShiftRequestId as ShiftRequestIdType,
  ShiftRequestType as ShiftRequestTypeType,
  TimeRange as TimeRangeType,
} from "./valueObject";
import { ShiftId, ShiftRequestId } from "./valueObject";

// Shift
type Shift = Readonly<{
  id: ShiftIdType;
  tenantId: TenantId;
  staffProfileId: StaffProfileId;
  date: Date;
  timeRange: TimeRangeType;
  recurringGroupId: RecurringGroupIdType | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { Shift };

export const Shift = {
  create: (params: {
    tenantId: TenantId;
    staffProfileId: StaffProfileId;
    date: Date;
    timeRange: TimeRangeType;
    recurringGroupId: RecurringGroupIdType | null;
  }): WithEvents<Shift, ShiftEvent> => {
    const now = new Date();
    const shift: Shift = {
      id: ShiftId.generate(),
      tenantId: params.tenantId,
      staffProfileId: params.staffProfileId,
      date: params.date,
      timeRange: params.timeRange,
      recurringGroupId: params.recurringGroupId,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: shift,
      events: [
        ShiftEvents.created(shift.id, shift.tenantId, shift.staffProfileId),
      ],
    };
  },

  update: (
    shift: Shift,
    params: {
      date?: Date;
      timeRange?: TimeRangeType;
    },
  ): WithEvents<Shift, ShiftEvent> => {
    return {
      entity: {
        ...shift,
        date: params.date !== undefined ? params.date : shift.date,
        timeRange:
          params.timeRange !== undefined ? params.timeRange : shift.timeRange,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  isRecurring: (shift: Shift): boolean => {
    return shift.recurringGroupId !== null;
  },

  containsTime: (shift: Shift, time: TimeOfDay): boolean => {
    return (
      TimeOfDayObj.compare(shift.timeRange.start, time) <= 0 &&
      TimeOfDayObj.compare(time, shift.timeRange.end) < 0
    );
  },
};

// ShiftRequest
type ShiftRequest = Readonly<{
  id: ShiftRequestIdType;
  tenantId: TenantId;
  staffProfileId: StaffProfileId;
  date: Date;
  type: ShiftRequestTypeType;
  timeRange: TimeRangeType | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { ShiftRequest };

export const ShiftRequest = {
  create: (params: {
    tenantId: TenantId;
    staffProfileId: StaffProfileId;
    date: Date;
    type: ShiftRequestTypeType;
    timeRange: TimeRangeType | null;
    note: string | null;
  }): WithEvents<ShiftRequest, ShiftEvent> => {
    const now = new Date();
    const request: ShiftRequest = {
      id: ShiftRequestId.generate(),
      tenantId: params.tenantId,
      staffProfileId: params.staffProfileId,
      date: params.date,
      type: params.type,
      timeRange: params.timeRange,
      note: params.note,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: request,
      events: [
        ShiftEvents.requestSubmitted(request.staffProfileId, request.tenantId),
      ],
    };
  },

  update: (
    request: ShiftRequest,
    params: {
      type?: ShiftRequestTypeType;
      timeRange?: TimeRangeType | null;
      note?: string | null;
    },
  ): WithEvents<ShiftRequest, ShiftEvent> => {
    return {
      entity: {
        ...request,
        type: params.type !== undefined ? params.type : request.type,
        timeRange:
          params.timeRange !== undefined ? params.timeRange : request.timeRange,
        note: params.note !== undefined ? params.note : request.note,
        updatedAt: new Date(),
      },
      events: [],
    };
  },
};
