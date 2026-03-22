import type { DomainEvent } from "@/core/domain/common/event";
import { TimeOfDay } from "@/core/domain/common/valueObject";
import { Shift } from "@/core/domain/shift/entity";
import { ShiftConflictChecker } from "@/core/domain/shift/services/shiftConflictChecker";
import { RecurringGroupId, TimeRange } from "@/core/domain/shift/valueObject";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type CreateShiftInput = {
  tenantId: string;
  staffProfileId: string;
  date: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  recurringEndDate: string | null;
};

export type CreateShiftOutput = {
  shiftIds: string[];
};

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isSameOrBefore(a: Date, b: Date): boolean {
  return (
    a.getFullYear() < b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth()) ||
    (a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() <= b.getDate())
  );
}

export async function createShift({
  container,
  input,
}: ServiceArgs<CreateShiftInput>): Promise<CreateShiftOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const staffProfileId = StaffProfileId.create(input.staffProfileId);
  const startTime = TimeOfDay.create(input.startTime);
  const endTime = TimeOfDay.create(input.endTime);
  const timeRange = TimeRange.create({ start: startTime, end: endTime });
  const baseDate = parseDate(input.date);

  // Build list of dates for shift creation
  const dates: Date[] = [baseDate];

  if (input.recurring) {
    if (!input.recurringEndDate) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "recurringEndDate is required for recurring shifts",
      );
    }
    const endDate = parseDate(input.recurringEndDate);
    let nextDate = addWeeks(baseDate, 1);
    while (isSameOrBefore(nextDate, endDate)) {
      dates.push(nextDate);
      nextDate = addWeeks(nextDate, 1);
    }
  }

  const recurringGroupId = input.recurring ? RecurringGroupId.generate() : null;

  // Execute all reads and writes in a single transaction for consistency
  const shiftIds = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Validate tenant exists and get business hours
      const tenant = await repositories.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      // Validate business hours for all dates
      for (const date of dates) {
        const dailyHours =
          tenant.businessHours[date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
        if (dailyHours === null) {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            `Shift date ${date.toISOString().split("T")[0]} is not a business day`,
          );
        }

        if (
          TimeOfDay.compare(startTime, dailyHours.open) < 0 ||
          TimeOfDay.compare(endTime, dailyHours.close) > 0
        ) {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            `Shift time is outside business hours on ${date.toISOString().split("T")[0]}`,
          );
        }
      }

      // Get existing shifts for conflict checking
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      const existingShifts =
        await repositories.shiftRepository.findByStaffProfileIdAndDateRange(
          staffProfileId,
          minDate,
          maxDate,
        );

      // Check conflicts for all dates
      for (const date of dates) {
        if (ShiftConflictChecker.hasConflict(existingShifts, date, timeRange)) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            `Shift conflicts with existing shift on ${date.toISOString().split("T")[0]}`,
          );
        }
      }

      // Create and save shifts
      const allEvents: DomainEvent[] = [];
      const ids: string[] = [];

      for (const date of dates) {
        const { entity, events } = Shift.create({
          tenantId,
          staffProfileId,
          date,
          timeRange,
          recurringGroupId,
        });
        await repositories.shiftRepository.save(entity);
        allEvents.push(...events);
        ids.push(entity.id);
      }

      await repositories.outboxRepository.saveEvents(allEvents);
      return ids;
    },
  );

  return { shiftIds };
}
