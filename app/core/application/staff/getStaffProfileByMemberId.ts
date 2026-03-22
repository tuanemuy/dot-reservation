import { MemberId } from "@/core/domain/member/valueObject";
import type { MenuRepository } from "@/core/domain/menu/ports/menuRepository";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { GetStaffProfileOutput, MenuSummary } from "./getStaffProfile";

export type GetStaffProfileByMemberIdInput = {
  memberId: string;
};

export type { GetStaffProfileOutput as GetStaffProfileByMemberIdOutput };

type GetStaffProfileByMemberIdArgs = {
  container: {
    staffProfileRepository: StaffProfileRepository;
    menuRepository: MenuRepository;
  };
  headers: Headers;
  input: GetStaffProfileByMemberIdInput;
};

export async function getStaffProfileByMemberId({
  container,
  input,
}: GetStaffProfileByMemberIdArgs): Promise<GetStaffProfileOutput> {
  const memberId = MemberId.create(input.memberId);

  const staffProfile =
    await container.staffProfileRepository.findByMemberId(memberId);
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
