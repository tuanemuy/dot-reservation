import { Invitation } from "@/core/domain/member/entity";
import { InvitationId } from "@/core/domain/member/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type CancelInvitationInput = {
  invitationId: string;
};

export async function cancelInvitation({
  container,
  input,
}: ServiceArgs<CancelInvitationInput>): Promise<void> {
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

    // Expired invitations cannot be cancelled
    if (Invitation.isExpired(invitation)) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Expired invitations cannot be cancelled",
      );
    }

    const { entity: cancelledInvitation, events } =
      Invitation.cancel(invitation);

    await repositories.invitationRepository.save(cancelledInvitation);
    await repositories.outboxRepository.saveEvents(events);
  });
}
