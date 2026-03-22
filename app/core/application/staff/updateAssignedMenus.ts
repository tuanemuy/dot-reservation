import { MenuId } from "@/core/domain/menu/valueObject";
import { StaffProfile } from "@/core/domain/staff/entity";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateAssignedMenusInput = {
  staffProfileId: string;
  menuIds: string[];
};

export type UpdateAssignedMenusOutput = undefined;

export async function updateAssignedMenus({
  container,
  input,
}: ServiceArgs<UpdateAssignedMenusInput>): Promise<UpdateAssignedMenusOutput> {
  const staffProfileId = StaffProfileId.create(input.staffProfileId);
  const menuIds = input.menuIds.map((id) => MenuId.create(id));

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const staffProfile =
      await repositories.staffProfileRepository.findById(staffProfileId);
    if (!staffProfile) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Staff profile not found",
      );
    }

    // Verify all menus exist
    for (const menuId of menuIds) {
      const menu = await repositories.menuRepository.findById(menuId);
      if (!menu) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Menu not found: ${menuId}`,
        );
      }
    }

    const updatedProfile = StaffProfile.updateAssignedMenus(
      staffProfile,
      menuIds,
    );

    await repositories.staffProfileRepository.save(updatedProfile);
  });

  return undefined;
}
