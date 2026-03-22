import type { DomainEvent } from "@/core/domain/common/event";
import { TimeOfDay } from "@/core/domain/common/valueObject";
import { Shift } from "@/core/domain/shift/entity";
import { ShiftConflictChecker } from "@/core/domain/shift/services/shiftConflictChecker";
import { ShiftId, TimeRange } from "@/core/domain/shift/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type UpdateShiftInput = {
  shiftId: string;
  startTime: string;
  endTime: string;
  updateScope: "single" | "future";
};

function isSameOrAfterDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() > b.getFullYear() ||
    (a.getFullYear() === b.getFullYear() && a.getMonth() > b.getMonth()) ||
    (a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() >= b.getDate())
  );
}

export async function updateShift({
  container,
  input,
}: ServiceArgs<UpdateShiftInput>): Promise<void> {
  const shiftId = ShiftId.create(input.shiftId);
  const startTime = TimeOfDay.create(input.startTime);
  const endTime = TimeOfDay.create(input.endTime);
  const newTimeRange = TimeRange.create({ start: startTime, end: endTime });

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const shift = await repositories.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Shift not found");
    }

    if (input.updateScope === "single") {
      // Get existing shifts for conflict checking
      const existingShifts =
        await repositories.shiftRepository.findByStaffProfileIdAndDateRange(
          shift.staffProfileId,
          shift.date,
          shift.date,
        );

      if (
        ShiftConflictChecker.hasConflict(
          existingShifts,
          shift.date,
          newTimeRange,
          shiftId,
        )
      ) {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "Updated shift conflicts with existing shift",
        );
      }

      const { entity: updated, events } = Shift.update(shift, {
        timeRange: newTimeRange,
      });

      await repositories.shiftRepository.save(updated);
      await repositories.outboxRepository.saveEvents(events);
    } else {
      // "future" scope: update this shift and all future shifts in the same recurring group
      let shiftsToUpdate: Awaited<
        ReturnType<typeof repositories.shiftRepository.findByRecurringGroupId>
      >;

      if (shift.recurringGroupId) {
        const groupShifts =
          await repositories.shiftRepository.findByRecurringGroupId(
            shift.recurringGroupId,
          );
        shiftsToUpdate = groupShifts.filter((s) =>
          isSameOrAfterDate(s.date, shift.date),
        );
      } else {
        shiftsToUpdate = [shift];
      }

      const allEvents: DomainEvent[] = [];

      for (const s of shiftsToUpdate) {
        // Check conflicts for each shift
        const existingShifts =
          await repositories.shiftRepository.findByStaffProfileIdAndDateRange(
            s.staffProfileId,
            s.date,
            s.date,
          );

        if (
          ShiftConflictChecker.hasConflict(
            existingShifts,
            s.date,
            newTimeRange,
            s.id,
          )
        ) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            `Updated shift conflicts with existing shift on ${s.date.toISOString().split("T")[0]}`,
          );
        }

        const { entity: updated, events } = Shift.update(s, {
          timeRange: newTimeRange,
        });
        await repositories.shiftRepository.save(updated);
        allEvents.push(...events);
      }

      await repositories.outboxRepository.saveEvents(allEvents);
    }
  });
}
