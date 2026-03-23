import { BusinessRuleError } from "@/core/domain/error";
import { MemberErrorCode } from "@/core/domain/member/errorCode";
import { MemberEvents } from "@/core/domain/member/events";
import { MemberPolicyService } from "@/core/domain/member/services/memberPolicyService";
import { MemberId } from "@/core/domain/member/valueObject";
import { Reservation } from "@/core/domain/reservation/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type RemoveMemberInput = {
  tenantId: string;
  operatorMemberId: string;
  targetMemberId: string;
};

export async function removeMember({
  container,
  input,
}: ServiceArgs<RemoveMemberInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const operatorMemberId = MemberId.create(input.operatorMemberId);
  const targetMemberId = MemberId.create(input.targetMemberId);

  if (operatorMemberId === targetMemberId) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Cannot remove yourself",
    );
  }

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

    try {
      MemberPolicyService.canRemoveMember(adminCount, member.role);
    } catch (error) {
      if (
        error instanceof BusinessRuleError &&
        error.code === MemberErrorCode.LastAdminCannotBeRemoved
      ) {
        throw new ConflictError(ConflictErrorCode.Conflict, error.message);
      }
      throw error;
    }

    // Delete StaffProfile if exists (FK constraint: staff_profiles.member_id -> members.id)
    // Before deleting, unassign active reservations for this staff
    const staffProfile =
      await repositories.staffProfileRepository.findByMemberId(targetMemberId);
    if (staffProfile) {
      // Unassign active reservations (pending/confirmed) for this staff
      const activeReservations =
        await repositories.reservationRepository.findByStaffProfileId(
          staffProfile.id,
          { status: "pending" },
          { page: 1, limit: 10000 },
        );
      const confirmedReservations =
        await repositories.reservationRepository.findByStaffProfileId(
          staffProfile.id,
          { status: "confirmed" },
          { page: 1, limit: 10000 },
        );
      const reservationsToUnassign = [
        ...activeReservations.items,
        ...confirmedReservations.items,
      ];
      for (const reservation of reservationsToUnassign) {
        const { entity: updated } = Reservation.update(reservation, {
          staffProfileId: null,
          staffName: null,
        });
        await repositories.reservationRepository.save(updated);
      }

      await repositories.staffProfileRepository.delete(staffProfile.id);
    }

    // Delete invitations created by this member (FK constraint: invitations.invited_by -> members.id)
    const createdInvitations =
      await repositories.invitationRepository.findByInvitedBy(targetMemberId);
    for (const invitation of createdInvitations) {
      await repositories.invitationRepository.delete(invitation.id);
    }

    await repositories.memberRepository.delete(targetMemberId);
    await repositories.outboxRepository.saveEvents([
      MemberEvents.removed(targetMemberId, tenantId),
    ]);
  });
}
