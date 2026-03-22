import { MenuId } from "@/core/domain/menu/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";
import type { StaffProfileSummary } from "./listStaffProfiles";

export type ListStaffsByMenuInput = {
  tenantId: string;
  menuId: string;
};

export type ListStaffsByMenuOutput = {
  items: StaffProfileSummary[];
};

export async function listStaffsByMenu({
  container,
  input,
}: ServiceArgs<ListStaffsByMenuInput>): Promise<ListStaffsByMenuOutput> {
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
