import type { MemberId } from "@/core/domain/member/valueObject";
import type { MenuId } from "@/core/domain/menu/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import type {
  StaffBio as StaffBioType,
  StaffDisplayName as StaffDisplayNameType,
  StaffProfileId as StaffProfileIdType,
} from "./valueObject";
import { StaffBio, StaffDisplayName, StaffProfileId } from "./valueObject";

type StaffProfile = Readonly<{
  id: StaffProfileIdType;
  tenantId: TenantId;
  memberId: MemberId;
  displayName: StaffDisplayNameType;
  imageUrl: string | null;
  bio: StaffBioType | null;
  assignedMenuIds: readonly MenuId[];
  createdAt: Date;
  updatedAt: Date;
}>;

const StaffProfile = {
  create: (params: {
    tenantId: TenantId;
    memberId: MemberId;
    displayName: string;
  }): StaffProfile => {
    const now = new Date();
    return {
      id: StaffProfileId.generate(),
      tenantId: params.tenantId,
      memberId: params.memberId,
      displayName: StaffDisplayName.create(params.displayName),
      imageUrl: null,
      bio: null,
      assignedMenuIds: [],
      createdAt: now,
      updatedAt: now,
    };
  },

  updateProfile: (
    staffProfile: StaffProfile,
    params: {
      displayName?: string;
      imageUrl?: string | null;
      bio?: string | null;
    },
  ): StaffProfile => {
    return {
      ...staffProfile,
      displayName:
        params.displayName !== undefined
          ? StaffDisplayName.create(params.displayName)
          : staffProfile.displayName,
      imageUrl:
        params.imageUrl !== undefined ? params.imageUrl : staffProfile.imageUrl,
      bio:
        params.bio !== undefined
          ? params.bio !== null
            ? StaffBio.create(params.bio)
            : null
          : staffProfile.bio,
      updatedAt: new Date(),
    };
  },

  updateAssignedMenus: (
    staffProfile: StaffProfile,
    menuIds: readonly MenuId[],
  ): StaffProfile => {
    return {
      ...staffProfile,
      assignedMenuIds: menuIds,
      updatedAt: new Date(),
    };
  },

  canHandleMenu: (staffProfile: StaffProfile, menuId: MenuId): boolean => {
    return staffProfile.assignedMenuIds.includes(menuId);
  },
};

export { StaffProfile };
