import type { MemberId } from "@/core/domain/member/valueObject";
import type { MenuId } from "@/core/domain/menu/valueObject";
import type { StaffProfile } from "@/core/domain/staff/entity";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface StaffProfileRepository {
  save(staffProfile: StaffProfile): Promise<void>;
  findById(id: StaffProfileId): Promise<StaffProfile | null>;
  findByMemberId(memberId: MemberId): Promise<StaffProfile | null>;
  findByTenantId(tenantId: TenantId): Promise<StaffProfile[]>;
  findByTenantIdAndMenuId(
    tenantId: TenantId,
    menuId: MenuId,
  ): Promise<StaffProfile[]>;
  delete(id: StaffProfileId): Promise<void>;
}
