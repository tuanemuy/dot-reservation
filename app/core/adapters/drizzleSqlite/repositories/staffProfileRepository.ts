import type { InferSelectModel } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";
import {
  staffAssignedMenus,
  staffProfiles,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { MemberId as MemberIdType } from "@/core/domain/member/valueObject";
import type { MenuId as MenuIdType } from "@/core/domain/menu/valueObject";
import type { StaffProfile as StaffProfileType } from "@/core/domain/staff/entity";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import type {
  StaffBio as StaffBioType,
  StaffDisplayName as StaffDisplayNameType,
  StaffProfileId as StaffProfileIdType,
} from "@/core/domain/staff/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type StaffProfileDataModel = InferSelectModel<typeof staffProfiles>;
type StaffAssignedMenuDataModel = InferSelectModel<typeof staffAssignedMenus>;

export class DrizzleSqliteStaffProfileRepository
  implements StaffProfileRepository
{
  constructor(private readonly executor: Executor) {}

  private into(
    data: StaffProfileDataModel,
    assignedMenus: StaffAssignedMenuDataModel[],
  ): StaffProfileType {
    return {
      id: data.id as StaffProfileIdType,
      tenantId: data.tenantId as TenantIdType,
      memberId: data.memberId as MemberIdType,
      displayName: data.displayName as StaffDisplayNameType,
      imageUrl: data.imageUrl,
      bio: data.bio as StaffBioType | null,
      assignedMenuIds: assignedMenus.map((m) => m.menuId as MenuIdType),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(staffProfile: StaffProfileType): Promise<void> {
    try {
      await this.executor
        .insert(staffProfiles)
        .values({
          id: staffProfile.id,
          tenantId: staffProfile.tenantId,
          memberId: staffProfile.memberId,
          displayName: staffProfile.displayName,
          imageUrl: staffProfile.imageUrl,
          bio: staffProfile.bio,
          createdAt: staffProfile.createdAt,
          updatedAt: staffProfile.updatedAt,
        })
        .onConflictDoUpdate({
          target: staffProfiles.id,
          set: {
            tenantId: staffProfile.tenantId,
            memberId: staffProfile.memberId,
            displayName: staffProfile.displayName,
            imageUrl: staffProfile.imageUrl,
            bio: staffProfile.bio,
            updatedAt: staffProfile.updatedAt,
          },
        });

      // Save assigned menus: delete existing and re-insert
      await this.executor
        .delete(staffAssignedMenus)
        .where(eq(staffAssignedMenus.staffProfileId, staffProfile.id));

      if (staffProfile.assignedMenuIds.length > 0) {
        const menuValues = staffProfile.assignedMenuIds.map((menuId) => ({
          staffProfileId: staffProfile.id,
          menuId,
        }));

        await this.executor.insert(staffAssignedMenus).values(menuValues);
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save staff profile",
        error,
      );
    }
  }

  async findById(id: StaffProfileIdType): Promise<StaffProfileType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.id, id))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      const assignedMenus = await this.executor
        .select()
        .from(staffAssignedMenus)
        .where(eq(staffAssignedMenus.staffProfileId, id));

      return this.into(rows[0], assignedMenus);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find staff profile by id",
        error,
      );
    }
  }

  async findByMemberId(
    memberId: MemberIdType,
  ): Promise<StaffProfileType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.memberId, memberId))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      const assignedMenus = await this.executor
        .select()
        .from(staffAssignedMenus)
        .where(eq(staffAssignedMenus.staffProfileId, rows[0].id));

      return this.into(rows[0], assignedMenus);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find staff profile by member id",
        error,
      );
    }
  }

  async findByTenantId(tenantId: TenantIdType): Promise<StaffProfileType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.tenantId, tenantId));

      if (rows.length === 0) {
        return [];
      }

      const profileIds = rows.map((row) => row.id);
      const allAssignedMenus = await this.executor
        .select()
        .from(staffAssignedMenus)
        .where(inArray(staffAssignedMenus.staffProfileId, profileIds));

      const menusByProfileId = new Map<string, StaffAssignedMenuDataModel[]>();
      for (const menu of allAssignedMenus) {
        const existing = menusByProfileId.get(menu.staffProfileId) || [];
        existing.push(menu);
        menusByProfileId.set(menu.staffProfileId, existing);
      }

      return rows.map((row) =>
        this.into(row, menusByProfileId.get(row.id) || []),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find staff profiles by tenant id",
        error,
      );
    }
  }

  async findByTenantIdAndMenuId(
    tenantId: TenantIdType,
    menuId: MenuIdType,
  ): Promise<StaffProfileType[]> {
    try {
      // Find staff profile IDs that are assigned to the given menu
      const assignedRows = await this.executor
        .select()
        .from(staffAssignedMenus)
        .where(eq(staffAssignedMenus.menuId, menuId));

      if (assignedRows.length === 0) {
        return [];
      }

      const profileIds = assignedRows.map((row) => row.staffProfileId);

      // Find staff profiles that belong to the tenant and are in the assigned list
      const rows = await this.executor
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.tenantId, tenantId));

      const filteredRows = rows.filter((row) => profileIds.includes(row.id));

      if (filteredRows.length === 0) {
        return [];
      }

      // Get all assigned menus for the filtered profiles
      const filteredProfileIds = filteredRows.map((row) => row.id);
      const allAssignedMenus = await this.executor
        .select()
        .from(staffAssignedMenus)
        .where(inArray(staffAssignedMenus.staffProfileId, filteredProfileIds));

      const menusByProfileId = new Map<string, StaffAssignedMenuDataModel[]>();
      for (const menu of allAssignedMenus) {
        const existing = menusByProfileId.get(menu.staffProfileId) || [];
        existing.push(menu);
        menusByProfileId.set(menu.staffProfileId, existing);
      }

      return filteredRows.map((row) =>
        this.into(row, menusByProfileId.get(row.id) || []),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find staff profiles by tenant id and menu id",
        error,
      );
    }
  }

  async delete(id: StaffProfileIdType): Promise<void> {
    try {
      await this.executor
        .delete(staffAssignedMenus)
        .where(eq(staffAssignedMenus.staffProfileId, id));
      await this.executor.delete(staffProfiles).where(eq(staffProfiles.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete staff profile",
        error,
      );
    }
  }
}
