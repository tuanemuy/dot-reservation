import type { DomainEvent } from "@/core/domain/common/event";
import { MemberEvents } from "@/core/domain/member/events";
import type { TenantMembership } from "@/core/domain/member/services/memberPolicyService";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { cleanupAuthUserIfOrphaned } from "../auth/cleanupAuthUserIfOrphaned";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteMemberAccountInput = {
  authUserId: string;
};

export async function deleteMemberAccount({
  container,
  input,
  headers,
}: ServiceArgs<DeleteMemberAccountInput>): Promise<void> {
  const { authUserId } = input;

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const members =
      await repositories.memberRepository.findByAuthUserId(authUserId);

    if (members.length === 0) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Member account not found",
      );
    }

    // Build tenant membership info for policy check
    const tenantMemberships: TenantMembership[] = await Promise.all(
      members.map(async (member) => {
        const adminCount =
          await repositories.memberRepository.countAdminsByTenantId(
            member.tenantId,
          );
        return {
          tenantId: member.tenantId,
          role: member.role,
          adminCount,
        };
      }),
    );

    MemberPolicyService.canDeleteAccount(tenantMemberships);

    // Remove from all tenants
    const events: DomainEvent[] = [];
    for (const member of members) {
      // Delete StaffProfile if exists (FK constraint: staff_profiles.member_id -> members.id)
      const staffProfile =
        await repositories.staffProfileRepository.findByMemberId(member.id);
      if (staffProfile) {
        await repositories.staffProfileRepository.delete(staffProfile.id);
      }

      // Delete invitations created by this member (FK constraint: invitations.invited_by -> members.id)
      const createdInvitations =
        await repositories.invitationRepository.findByInvitedBy(member.id);
      for (const invitation of createdInvitations) {
        await repositories.invitationRepository.delete(invitation.id);
      }

      await repositories.memberRepository.delete(member.id);
      events.push(MemberEvents.removed(member.id, member.tenantId));
    }

    await repositories.outboxRepository.saveEvents(events);
  });

  await cleanupAuthUserIfOrphaned({
    container,
    headers,
    input: { authUserId },
  });
}
