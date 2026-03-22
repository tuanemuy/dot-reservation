import type { Shift } from "@/core/domain/shift/entity";
import type {
  RecurringGroupId,
  ShiftId,
} from "@/core/domain/shift/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface ShiftRepository {
  save(shift: Shift): Promise<void>;
  findById(id: ShiftId): Promise<Shift | null>;
  findByTenantIdAndDateRange(
    tenantId: TenantId,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]>;
  findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileId,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]>;
  findByRecurringGroupId(groupId: RecurringGroupId): Promise<Shift[]>;
  delete(id: ShiftId): Promise<void>;
  deleteByRecurringGroupIdFromDate(
    groupId: RecurringGroupId,
    fromDate: Date,
  ): Promise<void>;
}
