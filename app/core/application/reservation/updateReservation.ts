import { TimeOfDay } from "@/core/domain/common/valueObject";
import { MenuId } from "@/core/domain/menu/valueObject";
import { Reservation } from "@/core/domain/reservation/entity";
import { AvailabilityService } from "@/core/domain/reservation/services/availabilityService";
import { StaffAssignmentService } from "@/core/domain/reservation/services/staffAssignmentService";
import { ReservationId } from "@/core/domain/reservation/valueObject";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type UpdateReservationInput = {
  reservationId: string;
  menuId: string;
  staffProfileId: string | null;
  date: string;
  startTime: string;
  note: string | null;
};

export type UpdateReservationOutput = {
  id: string;
  status: string;
};

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function timeOfDayToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeOfDay(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function updateReservation({
  container,
  input,
}: ServiceArgs<UpdateReservationInput>): Promise<UpdateReservationOutput> {
  const reservationId = ReservationId.create(input.reservationId);
  const menuId = MenuId.create(input.menuId);
  const startTime = TimeOfDay.create(input.startTime);
  const date = parseDate(input.date);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const reservation =
        await repositories.reservationRepository.findById(reservationId);
      if (!reservation) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Reservation not found",
        );
      }

      if (
        reservation.status !== "confirmed" &&
        reservation.status !== "pending"
      ) {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "Only confirmed or pending reservations can be modified",
        );
      }

      // Fetch menu for snapshot update
      const menu = await repositories.menuRepository.findById(menuId);
      if (!menu) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
      }

      // Calculate end time
      const startMinutes = timeOfDayToMinutes(input.startTime);
      const endMinutes = startMinutes + menu.duration;
      const endTimeStr = minutesToTimeOfDay(endMinutes);
      const endTime = TimeOfDay.create(endTimeStr);

      // Get tenant for reservation settings
      const tenant = await repositories.tenantRepository.findById(
        reservation.tenantId,
      );
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      // Get shifts and reservations for availability check
      const shifts =
        await repositories.shiftRepository.findByTenantIdAndDateRange(
          reservation.tenantId,
          date,
          date,
        );

      const existingReservations =
        await repositories.reservationRepository.findByTenantIdAndDateRange(
          reservation.tenantId,
          date,
          date,
        );

      // Exclude current reservation from existing reservations
      const otherReservations = existingReservations.filter(
        (r) => r.id !== reservationId,
      );

      let staffProfileId: ReturnType<typeof StaffProfileId.create> | null =
        null;
      let staffName: string | null = null;

      if (input.staffProfileId) {
        staffProfileId = StaffProfileId.create(input.staffProfileId);

        const isAvailable = AvailabilityService.isSlotAvailable({
          shifts,
          existingReservations: otherReservations,
          reservationSettings: tenant.reservationSettings,
          staffProfileId,
          date,
          startTime,
          endTime,
        });

        if (!isAvailable) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            "Selected time slot is not available",
          );
        }

        const staffProfile =
          await repositories.staffProfileRepository.findById(staffProfileId);
        staffName = staffProfile?.displayName ?? null;
      } else {
        // Auto-assign staff
        const staffProfiles =
          await repositories.staffProfileRepository.findByTenantIdAndMenuId(
            reservation.tenantId,
            menuId,
          );

        const assignedStaffId = StaffAssignmentService.assignStaff({
          availableStaffProfiles: staffProfiles.map((s) => s.id),
          shifts,
          existingReservations: otherReservations,
          reservationSettings: tenant.reservationSettings,
          date,
          startTime,
          endTime,
        });

        if (!assignedStaffId) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            "No available staff for the selected time slot",
          );
        }

        staffProfileId = assignedStaffId;
        const assignedProfile = staffProfiles.find(
          (s) => s.id === assignedStaffId,
        );
        staffName = assignedProfile?.displayName ?? null;
      }

      // Update reservation with new menu snapshot
      const { entity: updated, events } = Reservation.update(reservation, {
        staffProfileId,
        date,
        startTime,
        endTime,
        staffName,
        note: input.note,
      });

      // Update menu snapshot fields by creating a new object
      const withMenuSnapshot = {
        ...updated,
        menuId,
        menuName: menu.name as string,
        menuDuration: menu.duration as number,
        menuPrice: menu.price as number,
      };

      await repositories.reservationRepository.save(withMenuSnapshot);
      await repositories.outboxRepository.saveEvents(events);

      return {
        id: withMenuSnapshot.id as string,
        status: withMenuSnapshot.status as string,
      };
    },
  );

  return result;
}
