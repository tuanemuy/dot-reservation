import { Email } from "@/core/domain/common/valueObject";
import { Invitation } from "@/core/domain/member/entity";
import { MemberId, MemberRole } from "@/core/domain/member/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

const INVITATION_EXPIRY_DAYS = 7;

export type CreateInvitationInput = {
  tenantId: string;
  invitedByMemberId: string;
  email: string;
  role: string;
};

export type CreateInvitationOutput = {
  id: string;
};

export async function createInvitation({
  container,
  input,
}: ServiceArgs<CreateInvitationInput>): Promise<CreateInvitationOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const invitedByMemberId = MemberId.create(input.invitedByMemberId);
  const email = Email.create(input.email);
  const role = MemberRole.create(input.role);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const { entity: invitation, events } = Invitation.create({
    tenantId,
    email,
    role,
    invitedBy: invitedByMemberId,
    expiresAt,
  });

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    // Check if email is already a member of this tenant
    const existingMembers = await repositories.memberRepository.findByTenantId(
      tenantId,
      { page: 1, limit: 1000 },
    );
    const isAlreadyMember = existingMembers.items.some(
      (m) => m.email === email,
    );
    if (isAlreadyMember) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Email is already a member of this tenant",
      );
    }

    // Check if there's already a pending invitation for this email
    const pendingInvitations =
      await repositories.invitationRepository.findPendingByEmail(email);
    const hasPendingInvitation = pendingInvitations.some(
      (inv) => inv.tenantId === tenantId && Invitation.isPending(inv),
    );
    if (hasPendingInvitation) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "A pending invitation already exists for this email",
      );
    }

    // Check that the inviting member exists
    const invitingMember =
      await repositories.memberRepository.findById(invitedByMemberId);
    if (!invitingMember) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Inviting member not found",
      );
    }

    // Get tenant name for the email
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    await repositories.invitationRepository.save(invitation);
    await repositories.outboxRepository.saveEvents(events);

    // Send invitation email via EmailSender
    await container.memberEmailSender.sendInvitationEmail(
      email,
      invitation,
      tenant.name,
    );
  });

  return {
    id: invitation.id,
  };
}
