import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListInvitationsInput = {
  tenantId: string;
};

export type InvitationSummary = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type ListInvitationsOutput = {
  items: InvitationSummary[];
};

export async function listInvitations({
  container,
  input,
}: ServiceArgs<ListInvitationsInput>): Promise<ListInvitationsOutput> {
  const tenantId = TenantId.create(input.tenantId);

  const invitations = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      return repositories.invitationRepository.findByTenantId(tenantId);
    },
  );

  const items = invitations.map((invitation) => ({
    id: invitation.id as string,
    email: invitation.email as string,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  }));

  return { items };
}
