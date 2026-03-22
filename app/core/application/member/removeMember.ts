import { MemberEvents } from "@/core/domain/member/events";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { MemberId } from "@/core/domain/member/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type RemoveMemberInput = {
  tenantId: string;
  targetMemberId: string;
};

export async function removeMember({
  container,
  input,
}: ServiceArgs<RemoveMemberInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const targetMemberId = MemberId.create(input.targetMemberId);

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

    await repositories.memberRepository.delete(targetMemberId);
    await repositories.outboxRepository.saveEvents([
      MemberEvents.removed(targetMemberId, tenantId),
    ]);
  });
}
