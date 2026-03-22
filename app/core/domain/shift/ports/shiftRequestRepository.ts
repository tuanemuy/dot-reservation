import type { ShiftRequest } from "@/core/domain/shift/entity";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface ShiftRequestRepository {
  save(request: ShiftRequest): Promise<void>;
  findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileId,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftRequest[]>;
  findByTenantIdAndDateRange(
    tenantId: TenantId,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftRequest[]>;
  deleteByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileId,
    startDate: Date,
    endDate: Date,
  ): Promise<void>;
}
