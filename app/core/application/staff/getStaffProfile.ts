import type { MenuRepository } from "@/core/domain/menu/ports/menuRepository";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetStaffProfileInput = {
  staffProfileId: string;
};

export type MenuSummary = {
  id: string;
  name: string;
};

export type GetStaffProfileOutput = {
  id: string;
  displayName: string;
  imageUrl: string | null;
  bio: string | null;
  assignedMenus: MenuSummary[];
};

type GetStaffProfileArgs = {
  container: {
    staffProfileRepository: StaffProfileRepository;
    menuRepository: MenuRepository;
  };
  headers: Headers;
  input: GetStaffProfileInput;
};

export async function getStaffProfile({
  container,
  input,
}: GetStaffProfileArgs): Promise<GetStaffProfileOutput> {
  const staffProfileId = StaffProfileId.create(input.staffProfileId);

  const staffProfile =
    await container.staffProfileRepository.findById(staffProfileId);
  if (!staffProfile) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      "Staff profile not found",
    );
  }

  const assignedMenus: MenuSummary[] = [];
  for (const menuId of staffProfile.assignedMenuIds) {
    const menu = await container.menuRepository.findById(menuId);
    if (menu) {
      assignedMenus.push({
        id: menu.id,
        name: menu.name,
      });
    }
  }

  return {
    id: staffProfile.id,
    displayName: staffProfile.displayName,
    imageUrl: staffProfile.imageUrl,
    bio: staffProfile.bio,
    assignedMenus,
  };
}
