import { Email } from "@/core/domain/common/valueObject";
import { Invitation, Member } from "@/core/domain/member/entity";
import { InvitationId } from "@/core/domain/member/valueObject";
import { StaffProfile } from "@/core/domain/staff/entity";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type AcceptInvitationInput = {
  invitationId: string;
  authUserId: string;
  email: string;
};

export type AcceptInvitationOutput = {
  memberId: string;
  tenantId: string;
  role: string;
};

export async function acceptInvitation({
  container,
  input,
}: ServiceArgs<AcceptInvitationInput>): Promise<AcceptInvitationOutput> {
  const invitationId = InvitationId.create(input.invitationId);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const invitation =
        await repositories.invitationRepository.findById(invitationId);
      if (!invitation) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Invitation not found",
        );
      }

      // Verify the accepting user's email matches the invitation email
      const userEmail = Email.create(input.email);
      if (userEmail !== invitation.email) {
        throw new ForbiddenError(
          ForbiddenErrorCode.InsufficientPermissions,
          "You are not the intended recipient of this invitation",
        );
      }

      if (Invitation.isExpired(invitation)) {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "Invitation has expired",
        );
      }

      const { entity: acceptedInvitation, events: invitationEvents } =
        Invitation.accept(invitation);

      const { entity: member, events: memberEvents } = Member.create({
        tenantId: invitation.tenantId,
        authUserId: input.authUserId,
        name: invitation.email as string,
        email: invitation.email,
        phoneNumber: null,
        role: invitation.role,
      });

      await repositories.invitationRepository.save(acceptedInvitation);
      await repositories.memberRepository.save(member);

      // If role is staff, auto-create StaffProfile
      if (invitation.role === "staff") {
        const staffProfile = StaffProfile.create({
          tenantId: invitation.tenantId,
          memberId: member.id,
          displayName: member.name,
        });
        await repositories.staffProfileRepository.save(staffProfile);
      }

      await repositories.outboxRepository.saveEvents([
        ...invitationEvents,
        ...memberEvents,
      ]);

      return member;
    },
  );

  return {
    memberId: result.id,
    tenantId: result.tenantId,
    role: result.role,
  };
}
