import { Invitation } from "@/core/domain/member/entity";
import { InvitationId } from "@/core/domain/member/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeclineInvitationInput = {
  invitationId: string;
  authUserId: string;
};

export async function declineInvitation({
  container,
  input,
}: ServiceArgs<DeclineInvitationInput>): Promise<void> {
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

    if (Invitation.isExpired(invitation)) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Invitation has expired",
      );
    }

    const { entity: declinedInvitation, events } =
      Invitation.decline(invitation);

    await repositories.invitationRepository.save(declinedInvitation);
    await repositories.outboxRepository.saveEvents(events);
  });
}
