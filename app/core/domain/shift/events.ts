import type { DomainEventBase } from "@/core/domain/common/event";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import type { ShiftId } from "./valueObject";

export type ShiftCreatedEvent = DomainEventBase<
  "shift.created",
  { shiftId: ShiftId; tenantId: TenantId; staffProfileId: StaffProfileId }
>;

export type ShiftRequestSubmittedEvent = DomainEventBase<
  "shiftRequest.submitted",
  { staffProfileId: StaffProfileId; tenantId: TenantId }
>;

export type ShiftEvent = ShiftCreatedEvent | ShiftRequestSubmittedEvent;

export const ShiftEvents = {
  created: (
    shiftId: ShiftId,
    tenantId: TenantId,
    staffProfileId: StaffProfileId,
  ): ShiftCreatedEvent => ({
    type: "shift.created",
    payload: { shiftId, tenantId, staffProfileId },
    occurredAt: new Date(),
  }),

  requestSubmitted: (
    staffProfileId: StaffProfileId,
    tenantId: TenantId,
  ): ShiftRequestSubmittedEvent => ({
    type: "shiftRequest.submitted",
    payload: { staffProfileId, tenantId },
    occurredAt: new Date(),
  }),
};
