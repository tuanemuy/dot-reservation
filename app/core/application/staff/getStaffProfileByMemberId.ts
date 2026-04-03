import { MemberId } from "@/core/domain/member/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { GetStaffProfileOutput, MenuSummary } from "./getStaffProfile";

export type GetStaffProfileByMemberIdInput = {
  memberId: string;
};

export type { GetStaffProfileOutput as GetStaffProfileByMemberIdOutput };

export async function getStaffProfileByMemberId({
  container,
  input,
}: ServiceArgs<GetStaffProfileByMemberIdInput>): Promise<GetStaffProfileOutput> {
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
    imageUrl: staffProfile.imageUrl
      ? container.storageManager.resolveImageUrl(staffProfile.imageUrl)
      : null,
    bio: staffProfile.bio,
    assignedMenus,
  };
}
