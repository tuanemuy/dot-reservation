import { TimeOfDay } from "@/core/domain/common/valueObject";
import { CustomerId } from "@/core/domain/customer/valueObject";
import { MenuId } from "@/core/domain/menu/valueObject";
import { Reservation } from "@/core/domain/reservation/entity";
import { AvailabilityService } from "@/core/domain/reservation/services/availabilityService";
import { StaffAssignmentService } from "@/core/domain/reservation/services/staffAssignmentService";
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

export type CreateReservationInput = {
  tenantId: string;
  customerId: string;
  menuId: string;
  staffProfileId: string | null;
  date: string;
  startTime: string;
  note: string | null;
};

export type CreateReservationOutput = {
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

export async function createReservation({
  container,
  input,
}: ServiceArgs<CreateReservationInput>): Promise<CreateReservationOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const customerId = CustomerId.create(input.customerId);
  const menuId = MenuId.create(input.menuId);
  const startTime = TimeOfDay.create(input.startTime);
  const date = parseDate(input.date);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Fetch tenant
      const tenant = await repositories.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      // Check if tenant is active
      if (tenant.status === "suspended") {
        throw new ForbiddenError(
          ForbiddenErrorCode.InsufficientPermissions,
          "Tenant is suspended",
        );
      }

      // Fetch menu
      const menu = await repositories.menuRepository.findById(menuId);
      if (!menu) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
      }

      // Calculate end time from menu duration
      const startMinutes = timeOfDayToMinutes(input.startTime);
      const endMinutes = startMinutes + menu.duration;
      const endTimeStr = minutesToTimeOfDay(endMinutes);
      const endTime = TimeOfDay.create(endTimeStr);

      const now = new Date();

      // Check booking window
      const maxBookingDate = new Date(now);
      maxBookingDate.setDate(
        maxBookingDate.getDate() + tenant.reservationSettings.bookingWindowDays,
      );
      if (date > maxBookingDate) {
        throw new ValidationError(
          ValidationErrorCode.InvalidInput,
          "Reservation date exceeds booking window",
        );
      }

      // Check booking deadline
      const reservationDateTime = new Date(date);
      const [startH, startM] = input.startTime.split(":").map(Number);
      reservationDateTime.setHours(startH, startM, 0, 0);
      const deadlineMs =
        tenant.reservationSettings.bookingDeadlineHours * 60 * 60 * 1000;
      const deadline = new Date(reservationDateTime.getTime() - deadlineMs);
      if (now > deadline) {
        throw new ValidationError(
          ValidationErrorCode.InvalidInput,
          "Booking deadline has passed",
        );
      }

      // Get shifts and existing reservations for the date
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

      let staffProfileId: ReturnType<typeof StaffProfileId.create> | null =
        null;
      let staffName: string | null = null;

      if (input.staffProfileId) {
        staffProfileId = StaffProfileId.create(input.staffProfileId);

        // Verify slot availability for specific staff
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

        // Get staff profile and verify menu assignment
        const staffProfile =
          await repositories.staffProfileRepository.findById(staffProfileId);
        if (!staffProfile) {
          throw new NotFoundError(
            NotFoundErrorCode.NotFound,
            "Staff profile not found",
          );
        }

        if (!StaffProfile.canHandleMenu(staffProfile, menuId)) {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            "Staff is not assigned to handle this menu",
          );
        }

        staffName = staffProfile.displayName;
      } else {
        // Auto-assign staff
        const staffProfiles =
          await repositories.staffProfileRepository.findByTenantIdAndMenuId(
            tenantId,
            menuId,
          );

        const assignedStaffId = StaffAssignmentService.assignStaff({
          availableStaffProfiles: staffProfiles.map((s) => s.id),
          shifts,
          existingReservations,
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

      // Get customer info
      const customer =
        await repositories.customerRepository.findById(customerId);
      if (!customer) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Customer not found",
        );
      }
      const customerName = customer.displayName ?? null;
      const customerEmail = customer.email ?? null;
      const customerPhoneNumber = customer.phoneNumber ?? null;

      // Create reservation with menu snapshot
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
        staffName,
        customerName,
        customerEmail,
        customerPhoneNumber,
        note: input.note,
        createdBy: "customer",
        approvalMethod: tenant.reservationSettings.approvalMethod,
      });

      await repositories.reservationRepository.save(reservation);
      await repositories.outboxRepository.saveEvents(events);

      return {
        id: reservation.id as string,
        status: reservation.status as string,
      };
    },
  );

  return result;
}
