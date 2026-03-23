import { TimeOfDay } from "@/core/domain/common/valueObject";
import { CustomerId } from "@/core/domain/customer/valueObject";
import { MenuId } from "@/core/domain/menu/valueObject";
import { Reservation } from "@/core/domain/reservation/entity";
import { AvailabilityService } from "@/core/domain/reservation/services/availabilityService";
import { StaffProfile } from "@/core/domain/staff/entity";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type CreateProxyReservationInput = {
  tenantId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhoneNumber: string | null;
  menuId: string;
  staffProfileId: string;
  date: string;
  startTime: string;
  note: string | null;
  createdBy: "admin" | "staff";
};

export type CreateProxyReservationOutput = {
  id: string;
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

export async function createProxyReservation({
  container,
  input,
}: ServiceArgs<CreateProxyReservationInput>): Promise<CreateProxyReservationOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const menuId = MenuId.create(input.menuId);
  const staffProfileId = StaffProfileId.create(input.staffProfileId);
  const startTime = TimeOfDay.create(input.startTime);
  const date = parseDate(input.date);
  const customerId = input.customerId
    ? CustomerId.create(input.customerId)
    : null;

  // Validate past date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Cannot create a reservation for a past date",
    );
  }

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Fetch tenant
      const tenant = await repositories.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      // Fetch menu
      const menu = await repositories.menuRepository.findById(menuId);
      if (!menu) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
      }

      // Calculate end time
      const startMinutes = timeOfDayToMinutes(input.startTime);
      const endMinutes = startMinutes + menu.duration;
      const endTimeStr = minutesToTimeOfDay(endMinutes);
      const endTime = TimeOfDay.create(endTimeStr);

      // Get staff profile
      const staffProfile =
        await repositories.staffProfileRepository.findById(staffProfileId);
      if (!staffProfile) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Staff profile not found",
        );
      }

      // Staff permission check: staff can only create for their own assigned menus and shifts
      if (input.createdBy === "staff") {
        // Check menu assignment
        if (!StaffProfile.canHandleMenu(staffProfile, menuId)) {
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            "Staff is not assigned to this menu",
          );
        }

        // Check shift coverage
        const staffShifts =
          await repositories.shiftRepository.findByStaffProfileIdAndDateRange(
            staffProfileId,
            date,
            date,
          );
        const hasShiftCoverage = staffShifts.some((shift) => {
          const shiftStartMinutes = timeOfDayToMinutes(shift.timeRange.start);
          const shiftEndMinutes = timeOfDayToMinutes(shift.timeRange.end);
          return (
            startMinutes >= shiftStartMinutes && endMinutes <= shiftEndMinutes
          );
        });
        if (!hasShiftCoverage) {
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            "Reservation time is outside staff shift hours",
          );
        }
      }

      // Get shifts and reservations for availability check
      const shifts =
        await repositories.shiftRepository.findByTenantIdAndDateRange(
          tenantId,
          date,
          date,
        );

      const existingReservations =
        await repositories.reservationRepository.findByTenantIdAndDateRange(
          tenantId,
          date,
          date,
        );

      // Check slot availability
      const isAvailable = AvailabilityService.isSlotAvailable({
        shifts,
        existingReservations,
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

      // Create reservation (always confirmed for proxy reservations)
      const { entity: reservation, events } = Reservation.create({
        tenantId,
        customerId,
        menuId,
        staffProfileId,
        date,
        startTime,
        endTime,
        menuName: menu.name,
        menuDuration: menu.duration,
        menuPrice: menu.price,
        staffName: staffProfile.displayName,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhoneNumber: input.customerPhoneNumber,
        note: input.note,
        createdBy: input.createdBy,
        approvalMethod: "auto", // Always auto-approve for proxy reservations
      });

      await repositories.reservationRepository.save(reservation);
      await repositories.outboxRepository.saveEvents(events);

      return {
        id: reservation.id as string,
      };
    },
  );

  return result;
}
