import { BusinessRuleError } from "@/core/domain/error";
import { Member } from "@/core/domain/member/entity";
import { MemberErrorCode } from "@/core/domain/member/errorCode";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { MemberId, MemberRole } from "@/core/domain/member/valueObject";
import { StaffProfile } from "@/core/domain/staff/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type ChangeMemberRoleInput = {
  tenantId: string;
  operatorMemberId: string;
  targetMemberId: string;
  newRole: string;
};

export async function changeMemberRole({
  container,
  input,
}: ServiceArgs<ChangeMemberRoleInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const operatorMemberId = MemberId.create(input.operatorMemberId);
  const targetMemberId = MemberId.create(input.targetMemberId);
  const newRole = MemberRole.create(input.newRole);

  if (operatorMemberId === targetMemberId) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Cannot change your own role",
    );
  }

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const member = await repositories.memberRepository.findById(targetMemberId);
    if (!member) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Member not found");
    }

    if (member.tenantId !== tenantId) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Member not found");
    }

    const adminCount =
      await repositories.memberRepository.countAdminsByTenantId(tenantId);

    try {
      MemberPolicyService.canChangeRole(adminCount, member.role, newRole);
    } catch (error) {
      if (
        error instanceof BusinessRuleError &&
        error.code === MemberErrorCode.LastAdminCannotChangeRole
      ) {
        throw new ConflictError(ConflictErrorCode.Conflict, error.message);
      }
      throw error;
    }

    const { entity: updatedMember, events } = Member.changeRole(
      member,
      newRole,
    );

    await repositories.memberRepository.save(updatedMember);

    // If changing from admin to staff, auto-create StaffProfile
    if (member.role === "admin" && newRole === "staff") {
      const existingProfile =
        await repositories.staffProfileRepository.findByMemberId(
          targetMemberId,
        );
      if (!existingProfile) {
        const staffProfile = StaffProfile.create({
          tenantId,
          memberId: targetMemberId,
          displayName: member.name,
        });
        await repositories.staffProfileRepository.save(staffProfile);
      }
    }

    await repositories.outboxRepository.saveEvents(events);
  });
}
