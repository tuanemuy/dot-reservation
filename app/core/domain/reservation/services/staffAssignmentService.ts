import type { TimeOfDay } from "@/core/domain/common/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { ReservationSettings } from "@/core/domain/tenant/valueObject";
import type { Reservation } from "../entity";
import type { ShiftForAvailability } from "./availabilityService";
import { AvailabilityService } from "./availabilityService";

export const StaffAssignmentService = {
  assignStaff: (params: {
    availableStaffProfiles: readonly StaffProfileId[];
    shifts: readonly ShiftForAvailability[];
    existingReservations: readonly Reservation[];
    reservationSettings: ReservationSettings;
    date: Date;
    startTime: TimeOfDay;
    endTime: TimeOfDay;
  }): StaffProfileId | null => {
    for (const staffProfileId of params.availableStaffProfiles) {
      const isAvailable = AvailabilityService.isSlotAvailable({
        shifts: params.shifts,
        existingReservations: params.existingReservations,
        reservationSettings: params.reservationSettings,
        staffProfileId,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
      });

      if (isAvailable) {
        return staffProfileId;
      }
    }

    return null;
  },
};
