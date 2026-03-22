import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListShiftRequestsInput = {
  tenantId: string;
  startDate: string;
  endDate: string;
  staffProfileId: string | null;
};

export type ShiftRequestDetail = {
  id: string;
  tenantId: string;
  staffProfileId: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListShiftRequestsOutput = {
  items: ShiftRequestDetail[];
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

function toShiftRequestDetail(request: {
  id: string;
  tenantId: string;
  staffProfileId: string;
  date: Date;
  type: string;
  timeRange: { start: string; end: string } | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ShiftRequestDetail {
  return {
    id: request.id,
    tenantId: request.tenantId,
    staffProfileId: request.staffProfileId,
    date: formatDate(request.date),
    type: request.type,
    startTime: request.timeRange?.start ?? null,
    endTime: request.timeRange?.end ?? null,
    note: request.note,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export async function listShiftRequests({
  container,
  input,
}: ServiceArgs<ListShiftRequestsInput>): Promise<ListShiftRequestsOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);

  const requests = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      if (input.staffProfileId) {
        const staffProfileId = StaffProfileId.create(input.staffProfileId);
        return repositories.shiftRequestRepository.findByStaffProfileIdAndDateRange(
          staffProfileId,
          startDate,
          endDate,
        );
      }
      return repositories.shiftRequestRepository.findByTenantIdAndDateRange(
        tenantId,
        startDate,
        endDate,
      );
    },
  );

  return {
    items: requests.map(toShiftRequestDetail),
  };
}
