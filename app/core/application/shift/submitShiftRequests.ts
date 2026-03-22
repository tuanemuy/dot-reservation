import type { DomainEvent } from "@/core/domain/common/event";
import { TimeOfDay } from "@/core/domain/common/valueObject";
import { ShiftRequest } from "@/core/domain/shift/entity";
import { ShiftRequestType, TimeRange } from "@/core/domain/shift/valueObject";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ShiftRequestInput = {
  date: string;
  type: string;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export type SubmitShiftRequestsInput = {
  staffProfileId: string;
  tenantId: string;
  requests: ShiftRequestInput[];
};

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function submitShiftRequests({
  container,
  input,
}: ServiceArgs<SubmitShiftRequestsInput>): Promise<void> {
  const staffProfileId = StaffProfileId.create(input.staffProfileId);
  const tenantId = TenantId.create(input.tenantId);

  // Parse all request dates
  const requestDates = input.requests.map((r) => parseDate(r.date));

  // Determine the date range that covers all requests
  const minDate = new Date(Math.min(...requestDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...requestDates.map((d) => d.getTime())));

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    // Delete existing requests for this staff in the covered date range
    await repositories.shiftRequestRepository.deleteByStaffProfileIdAndDateRange(
      staffProfileId,
      minDate,
      maxDate,
    );

    const allEvents: DomainEvent[] = [];

    for (let i = 0; i < input.requests.length; i++) {
      const req = input.requests[i];
      const date = requestDates[i];
      const type = ShiftRequestType.create(req.type);

      let timeRange = null;
      if (req.startTime && req.endTime) {
        const startTime = TimeOfDay.create(req.startTime);
        const endTime = TimeOfDay.create(req.endTime);
        timeRange = TimeRange.create({ start: startTime, end: endTime });
      }

      const { entity: shiftRequest, events } = ShiftRequest.create({
        tenantId,
        staffProfileId,
        date,
        type,
        timeRange,
        note: req.note ?? null,
      });

      await repositories.shiftRequestRepository.save(shiftRequest);
      allEvents.push(...events);
    }

    await repositories.outboxRepository.saveEvents(allEvents);
  });
}
