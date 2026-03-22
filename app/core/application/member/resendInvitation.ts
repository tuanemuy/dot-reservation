import type { EmailSender } from "@/core/domain/member/ports/emailSender";
import { InvitationId } from "@/core/domain/member/valueObject";
import type { Container } from "../container/server";
import { NotFoundError, NotFoundErrorCode } from "../error";
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

    // Reset expiry date
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const updatedInvitation: typeof invitation = {
      ...invitation,
      status: "pending",
      expiresAt: newExpiresAt,
      updatedAt: new Date(),
    };

    await repositories.invitationRepository.save(updatedInvitation);

    // Get tenant name for the email
    const tenant = await repositories.tenantRepository.findById(
      invitation.tenantId,
    );
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    // Resend invitation email via EmailSender
    const emailSender = (container as Container & { emailSender: EmailSender })
      .emailSender;
    await emailSender.sendInvitationEmail(
      invitation.email,
      updatedInvitation,
      tenant.name,
    );
  });
}
