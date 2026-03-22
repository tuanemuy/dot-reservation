import { MenuId } from "@/core/domain/menu/valueObject";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { StaffProfileSummary } from "./listStaffProfiles";

export type ListStaffsByMenuInput = {
  tenantId: string;
  menuId: string;
};

export type ListStaffsByMenuOutput = {
  items: StaffProfileSummary[];
};

type ListStaffsByMenuArgs = {
  container: {
    staffProfileRepository: StaffProfileRepository;
  };
  headers: Headers;
  input: ListStaffsByMenuInput;
};

export async function listStaffsByMenu({
  container,
  input,
}: ListStaffsByMenuArgs): Promise<ListStaffsByMenuOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const menuId = MenuId.create(input.menuId);

  const staffProfiles =
    await container.staffProfileRepository.findByTenantIdAndMenuId(
      tenantId,
      menuId,
    );

  return {
    items: staffProfiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      imageUrl: profile.imageUrl,
    })),
  };
}
