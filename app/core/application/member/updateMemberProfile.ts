import { PhoneNumber } from "@/core/domain/common/valueObject";
import { Member } from "@/core/domain/member/entity";
import { MemberId } from "@/core/domain/member/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateMemberProfileInput = {
  memberId: string;
  name: string;
  phoneNumber: string | null;
};

export type UpdateMemberProfileOutput = {
  id: string;
  name: string;
  phoneNumber: string | null;
};

export async function updateMemberProfile({
  container,
  input,
}: ServiceArgs<UpdateMemberProfileInput>): Promise<UpdateMemberProfileOutput> {
  const memberId = MemberId.create(input.memberId);
  const phoneNumber = input.phoneNumber
    ? PhoneNumber.create(input.phoneNumber)
    : null;

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const member = await repositories.memberRepository.findById(memberId);
      if (!member) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Member not found");
      }

      const { entity: updatedMember, events } = Member.updateProfile(member, {
        name: input.name,
        phoneNumber,
      });

      await repositories.memberRepository.save(updatedMember);
      await repositories.outboxRepository.saveEvents(events);

      return updatedMember;
    },
  );

  return {
    id: result.id,
    name: result.name,
    phoneNumber: result.phoneNumber,
  };
}
