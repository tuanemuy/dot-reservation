import { TimeOfDay as TimeOfDayObj } from "@/core/domain/common/valueObject";
import type { Shift } from "../entity";
import type { ShiftId, TimeRange } from "../valueObject";

const hasTimeRangeOverlap = (a: TimeRange, b: TimeRange): boolean => {
  return (
    TimeOfDayObj.compare(a.start, b.end) < 0 &&
    TimeOfDayObj.compare(b.start, a.end) < 0
  );
};

const isSameDate = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const ShiftConflictChecker = {
  hasConflict: (
    existingShifts: Shift[],
    date: Date,
    timeRange: TimeRange,
    excludeShiftId?: ShiftId,
  ): boolean => {
    return existingShifts.some((shift) => {
      if (excludeShiftId && shift.id === excludeShiftId) {
        return false;
      }
      if (!isSameDate(shift.date, date)) {
        return false;
      }
      return hasTimeRangeOverlap(shift.timeRange, timeRange);
    });
  },
};
