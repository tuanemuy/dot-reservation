import { BusinessRuleError } from "@/core/domain/error";
import { MemberErrorCode } from "../errorCode";
import type { MemberRole } from "../valueObject";

type TenantMembership = {
  readonly tenantId: string;
  readonly role: MemberRole;
  readonly adminCount: number;
};

export const MemberPolicyService = {
  /**
   * メンバーを削除できるか検証する。
   * 唯一の管理者は削除できない。
   */
  canRemoveMember: (adminCount: number, targetRole: MemberRole): void => {
    if (targetRole === "admin" && adminCount <= 1) {
      throw new BusinessRuleError(
        MemberErrorCode.LastAdminCannotBeRemoved,
        "Cannot remove the last admin of the tenant",
      );
    }
  },

  /**
   * ロールを変更できるか検証する。
   * 唯一の管理者をスタッフに変更することはできない。
   */
  canChangeRole: (
    adminCount: number,
    currentRole: MemberRole,
    newRole: MemberRole,
  ): void => {
    if (currentRole === "admin" && newRole === "staff" && adminCount <= 1) {
      throw new BusinessRuleError(
        MemberErrorCode.LastAdminCannotChangeRole,
        "Cannot change the role of the last admin",
      );
    }
  },

  /**
   * アカウントを削除できるか検証する。
   * 唯一の管理者であるテナントが存在する場合は削除できない。
   */
  canDeleteAccount: (tenantMemberships: readonly TenantMembership[]): void => {
    for (const membership of tenantMemberships) {
      if (membership.role === "admin" && membership.adminCount <= 1) {
        throw new BusinessRuleError(
          MemberErrorCode.LastAdminCannotDeleteAccount,
          "Cannot delete account while being the last admin of a tenant",
        );
      }
    }
  },
};

export type { TenantMembership };
