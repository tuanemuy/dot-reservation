import type { DayOfWeek, TimeOfDay } from "@/core/domain/common/valueObject";
import { TimeOfDay as TimeOfDayObj } from "@/core/domain/common/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type {
  BusinessHours,
  DailyHours,
  ReservationSettings,
  TemporaryHoliday,
} from "@/core/domain/tenant/valueObject";
import type { Reservation } from "../entity";
import type { TimeSlot } from "../valueObject";

type ShiftForAvailability = Readonly<{
  staffProfileId: StaffProfileId;
  date: Date;
  timeRange: {
    readonly start: TimeOfDay;
    readonly end: TimeOfDay;
  };
}>;

export type { ShiftForAvailability };

function timeOfDayToMinutes(time: TimeOfDay): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeOfDay(totalMinutes: number): TimeOfDay {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return TimeOfDayObj.create(
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  );
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const AvailabilityService = {
  getAvailableSlots: (params: {
    businessHours: BusinessHours;
    regularHolidays: readonly DayOfWeek[];
    temporaryHolidays: readonly TemporaryHoliday[];
    reservationSettings: ReservationSettings;
    shifts: readonly ShiftForAvailability[];
    existingReservations: readonly Reservation[];
    menuDuration: number;
    date: Date;
  }): TimeSlot[] => {
    const dayOfWeek = params.date.getDay() as DayOfWeek;

    // Check regular holidays
    if (params.regularHolidays.includes(dayOfWeek)) {
      return [];
    }

    // Check temporary holidays
    if (
      params.temporaryHolidays.some((holiday) =>
        isSameDate(holiday.date, params.date),
      )
    ) {
      return [];
    }

    // Get business hours for this day
    const dailyHours: DailyHours = params.businessHours[dayOfWeek];
    if (dailyHours === null) {
      return [];
    }

    // Get shifts for this date
    const shiftsForDate = params.shifts.filter((shift) =>
      isSameDate(shift.date, params.date),
    );

    if (shiftsForDate.length === 0) {
      return [];
    }

    const slotDuration = params.menuDuration;
    const bufferMinutes = params.reservationSettings.bufferMinutes;
    const businessOpenMinutes = timeOfDayToMinutes(dailyHours.open);
    const businessCloseMinutes = timeOfDayToMinutes(dailyHours.close);

    // Get active reservations for this date (only pending and confirmed count)
    const activeReservations = params.existingReservations.filter(
      (r) =>
        isSameDate(r.date, params.date) &&
        (r.status === "pending" || r.status === "confirmed"),
    );

    const availableSlots: TimeSlot[] = [];
    const slotStep = params.reservationSettings.slotDurationMinutes;

    // Iterate through possible slot start times within business hours
    for (
      let startMinutes = businessOpenMinutes;
      startMinutes + slotDuration <= businessCloseMinutes;
      startMinutes += slotStep
    ) {
      const endMinutes = startMinutes + slotDuration;
      const startTime = minutesToTimeOfDay(startMinutes);
      const endTime = minutesToTimeOfDay(endMinutes);

      // Check if any staff has availability for this slot
      const hasAvailableStaff = shiftsForDate.some((shift) => {
        const shiftStartMinutes = timeOfDayToMinutes(shift.timeRange.start);
        const shiftEndMinutes = timeOfDayToMinutes(shift.timeRange.end);

        // Check that the slot fits within this staff's shift
        if (startMinutes < shiftStartMinutes || endMinutes > shiftEndMinutes) {
          return false;
        }

        // Check for conflicts with existing reservations for this staff
        const staffReservations = activeReservations.filter(
          (r) =>
            r.staffProfileId !== null &&
            r.staffProfileId === shift.staffProfileId,
        );

        const hasConflict = staffReservations.some((r) => {
          const rStartMinutes = timeOfDayToMinutes(r.startTime);
          const rEndMinutes = timeOfDayToMinutes(r.endTime);
          const rEndWithBuffer = rEndMinutes + bufferMinutes;
          const slotEndWithBuffer = endMinutes + bufferMinutes;

          // Check overlap considering buffer
          return (
            startMinutes < rEndWithBuffer && rStartMinutes < slotEndWithBuffer
          );
        });

        return !hasConflict;
      });

      if (hasAvailableStaff) {
        availableSlots.push({
          date: params.date,
          startTime,
          endTime,
        });
      }
    }

    return availableSlots;
  },

  isSlotAvailable: (params: {
    shifts: readonly ShiftForAvailability[];
    existingReservations: readonly Reservation[];
    reservationSettings: ReservationSettings;
    staffProfileId: StaffProfileId;
    date: Date;
    startTime: TimeOfDay;
    endTime: TimeOfDay;
  }): boolean => {
    const bufferMinutes = params.reservationSettings.bufferMinutes;

    // Check if the staff has a shift covering this time
    const staffShifts = params.shifts.filter(
      (shift) =>
        shift.staffProfileId === params.staffProfileId &&
        isSameDate(shift.date, params.date),
    );

    const startMinutes = timeOfDayToMinutes(params.startTime);
    const endMinutes = timeOfDayToMinutes(params.endTime);

    const isCoveredByShift = staffShifts.some((shift) => {
      const shiftStartMinutes = timeOfDayToMinutes(shift.timeRange.start);
      const shiftEndMinutes = timeOfDayToMinutes(shift.timeRange.end);
      return startMinutes >= shiftStartMinutes && endMinutes <= shiftEndMinutes;
    });

    if (!isCoveredByShift) {
      return false;
    }

    // Check for conflicts with existing reservations
    const staffReservations = params.existingReservations.filter(
      (r) =>
        r.staffProfileId === params.staffProfileId &&
        isSameDate(r.date, params.date) &&
        (r.status === "pending" || r.status === "confirmed"),
    );

    const hasConflict = staffReservations.some((r) => {
      const rStartMinutes = timeOfDayToMinutes(r.startTime);
      const rEndMinutes = timeOfDayToMinutes(r.endTime);
      const rEndWithBuffer = rEndMinutes + bufferMinutes;
      const slotEndWithBuffer = endMinutes + bufferMinutes;

      // Check overlap considering buffer
      return startMinutes < rEndWithBuffer && rStartMinutes < slotEndWithBuffer;
    });

    return !hasConflict;
  },
};
