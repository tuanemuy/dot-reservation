import { Email } from "@/core/domain/common/valueObject";
import { Invitation } from "@/core/domain/member/entity";
import type { ServiceArgs } from "../types";

export type ListPendingInvitationsInput = {
  email: string;
};

export type PendingInvitation = {
  id: string;
  tenantId: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

export type ListPendingInvitationsOutput = {
  items: PendingInvitation[];
};

export async function listPendingInvitations({
  container,
  input,
}: ServiceArgs<ListPendingInvitationsInput>): Promise<ListPendingInvitationsOutput> {
  const email = Email.create(input.email);

  const invitations = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      return repositories.invitationRepository.findPendingByEmail(email);
    },
  );

  // Filter out expired invitations
  const pendingItems = invitations
    .filter((inv) => Invitation.isPending(inv))
    .map((inv) => ({
      id: inv.id as string,
      tenantId: inv.tenantId as string,
      role: inv.role,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    }));

  return { items: pendingItems };
}
