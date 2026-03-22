import { Invitation } from "@/core/domain/member/entity";
import { InvitationId } from "@/core/domain/member/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

const INVITATION_EXPIRY_DAYS = 7;

export type ResendInvitationInput = {
  invitationId: string;
};

export async function resendInvitation({
  container,
  input,
}: ServiceArgs<ResendInvitationInput>): Promise<void> {
  const invitationId = InvitationId.create(input.invitationId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const invitation =
      await repositories.invitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Invitation not found",
      );
    }

    // Only pending or expired invitations can be resent
    if (invitation.status !== "pending") {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Only pending or expired invitations can be resent",
      );
    }

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const updatedInvitation = Invitation.resend(invitation, newExpiresAt);

    await repositories.invitationRepository.save(updatedInvitation);

    // Get tenant name for the email
    const tenant = await repositories.tenantRepository.findById(
      invitation.tenantId,
    );
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    // Resend invitation email via EmailSender
    await container.memberEmailSender.sendInvitationEmail(
      invitation.email,
      updatedInvitation,
      tenant.name,
    );
  });
}
