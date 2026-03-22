import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListShiftsInput = {
  tenantId: string;
  startDate: string;
  endDate: string;
  staffProfileId: string | null;
};

export type ShiftDetail = {
  id: string;
  tenantId: string;
  staffProfileId: string;
  date: string;
  startTime: string;
  endTime: string;
  recurringGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListShiftsOutput = {
  items: ShiftDetail[];
};

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toShiftDetail(shift: {
  id: string;
  tenantId: string;
  staffProfileId: string;
  date: Date;
  timeRange: { start: string; end: string };
  recurringGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ShiftDetail {
  return {
    id: shift.id,
    tenantId: shift.tenantId,
    staffProfileId: shift.staffProfileId,
    date: formatDate(shift.date),
    startTime: shift.timeRange.start,
    endTime: shift.timeRange.end,
    recurringGroupId: shift.recurringGroupId,
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}

export async function listShifts({
  container,
  input,
}: ServiceArgs<ListShiftsInput>): Promise<ListShiftsOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);

  const shifts = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      if (input.staffProfileId) {
        const staffProfileId = StaffProfileId.create(input.staffProfileId);
        return repositories.shiftRepository.findByStaffProfileIdAndDateRange(
          staffProfileId,
          startDate,
          endDate,
        );
      }
      return repositories.shiftRepository.findByTenantIdAndDateRange(
        tenantId,
        startDate,
        endDate,
      );
    },
  );

  return {
    items: shifts.map(toShiftDetail),
  };
}
