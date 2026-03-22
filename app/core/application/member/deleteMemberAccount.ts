import type { DomainEvent } from "@/core/domain/common/event";
import { MemberEvents } from "@/core/domain/member/events";
import type { TenantMembership } from "@/core/domain/member/services/memberPolicyService";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteMemberAccountInput = {
  authUserId: string;
};

export async function deleteMemberAccount({
  container,
  input,
}: ServiceArgs<DeleteMemberAccountInput>): Promise<void> {
  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const members = await repositories.memberRepository.findByAuthUserId(
      input.authUserId,
    );

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
      await repositories.memberRepository.delete(member.id);
      events.push(MemberEvents.removed(member.id, member.tenantId));
    }

    await repositories.outboxRepository.saveEvents(events);
  });
}
