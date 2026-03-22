import { MemberEvents } from "@/core/domain/member/events";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { MemberId } from "@/core/domain/member/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type RemoveMemberInput = {
  tenantId: string;
  operatorMemberId: string;
  targetMemberId: string;
};

export async function removeMember({
  container,
  input,
}: ServiceArgs<RemoveMemberInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const operatorMemberId = MemberId.create(input.operatorMemberId);
  const targetMemberId = MemberId.create(input.targetMemberId);

  if (operatorMemberId === targetMemberId) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Cannot remove yourself",
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

    MemberPolicyService.canRemoveMember(adminCount, member.role);

    // Delete StaffProfile if exists (FK constraint: staff_profiles.member_id -> members.id)
    const staffProfile =
      await repositories.staffProfileRepository.findByMemberId(targetMemberId);
    if (staffProfile) {
      await repositories.staffProfileRepository.delete(staffProfile.id);
    }

    // Delete invitations created by this member (FK constraint: invitations.invited_by -> members.id)
    const createdInvitations =
      await repositories.invitationRepository.findByInvitedBy(targetMemberId);
    for (const invitation of createdInvitations) {
      await repositories.invitationRepository.delete(invitation.id);
    }

    await repositories.memberRepository.delete(targetMemberId);
    await repositories.outboxRepository.saveEvents([
      MemberEvents.removed(targetMemberId, tenantId),
    ]);
  });
}
