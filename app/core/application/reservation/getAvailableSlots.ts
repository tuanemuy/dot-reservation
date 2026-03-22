import type { DayOfWeek } from "@/core/domain/common/valueObject";
import { MenuId } from "@/core/domain/menu/valueObject";
import { AvailabilityService } from "@/core/domain/reservation/services/availabilityService";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type GetAvailableSlotsInput = {
  tenantId: string;
  menuId: string;
  staffProfileId: string | null;
  date: string;
};

export type AvailableSlot = {
  startTime: string;
  available: boolean;
};

export type GetAvailableSlotsOutput = {
  slots: AvailableSlot[];
};

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function getAvailableSlots({
  container,
  input,
}: ServiceArgs<GetAvailableSlotsInput>): Promise<GetAvailableSlotsOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const menuId = MenuId.create(input.menuId);
  const date = parseDate(input.date);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Fetch tenant
      const tenant = await repositories.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      // Check if date is within booking window
      const now = new Date();
      const maxBookingDate = new Date(now);
      maxBookingDate.setDate(
        maxBookingDate.getDate() + tenant.reservationSettings.bookingWindowDays,
      );
      if (date > maxBookingDate) {
        return { slots: [] };
      }

      // Check if it's a holiday
      const dayOfWeek = date.getDay() as DayOfWeek;
      if (tenant.regularHolidays.includes(dayOfWeek)) {
        return { slots: [] };
      }

      const isTemporaryHoliday = tenant.temporaryHolidays.some(
        (h: { date: Date; reason: string | null }) =>
          h.date.getFullYear() === date.getFullYear() &&
          h.date.getMonth() === date.getMonth() &&
          h.date.getDate() === date.getDate(),
      );
      if (isTemporaryHoliday) {
        return { slots: [] };
      }

      // Fetch menu
      const menu = await repositories.menuRepository.findById(menuId);
      if (!menu) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Menu not found");
      }

      // Get shifts for the date
      const shifts = input.staffProfileId
        ? await repositories.shiftRepository.findByStaffProfileIdAndDateRange(
            StaffProfileId.create(input.staffProfileId),
            date,
            date,
          )
        : await repositories.shiftRepository.findByTenantIdAndDateRange(
            tenantId,
            date,
            date,
          );

      // Get existing reservations
      const existingReservations =
        await repositories.reservationRepository.findByTenantIdAndDateRange(
          tenantId,
          date,
          date,
        );

      // Calculate available slots
      const availableSlots = AvailabilityService.getAvailableSlots({
        businessHours: tenant.businessHours,
        regularHolidays: [...tenant.regularHolidays],
        temporaryHolidays: [...tenant.temporaryHolidays],
        reservationSettings: tenant.reservationSettings,
        shifts: shifts.map((s) => ({
          staffProfileId: s.staffProfileId,
          date: s.date,
          timeRange: s.timeRange,
        })),
        existingReservations,
        menuDuration: menu.duration,
        date,
      });

      // Build output: all slots in business hours with availability flag
      const dailyHours = tenant.businessHours[dayOfWeek];
      if (dailyHours === null) {
        return { slots: [] };
      }

      const slotStep = tenant.reservationSettings.slotDurationMinutes;
      const [openH, openM] = dailyHours.open.split(":").map(Number);
      const [closeH, closeM] = dailyHours.close.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      const allSlots: AvailableSlot[] = [];
      for (
        let m = openMinutes;
        m + menu.duration <= closeMinutes;
        m += slotStep
      ) {
        const hours = Math.floor(m / 60);
        const minutes = m % 60;
        const slotStartTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

        const isAvailable = availableSlots.some(
          (s) => s.startTime === slotStartTime,
        );

        allSlots.push({
          startTime: slotStartTime,
          available: isAvailable,
        });
      }

      return { slots: allSlots };
    },
  );

  return result;
}
