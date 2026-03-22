import type { Email } from "@/core/domain/common/valueObject";
import type { Invitation } from "@/core/domain/member/entity";
import type { InvitationId, MemberId } from "@/core/domain/member/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface InvitationRepository {
  save(invitation: Invitation): Promise<void>;
  findById(id: InvitationId): Promise<Invitation | null>;
  findByTenantId(tenantId: TenantId): Promise<Invitation[]>;
  findPendingByEmail(email: Email): Promise<Invitation[]>;
  findByInvitedBy(memberId: MemberId): Promise<Invitation[]>;
  delete(id: InvitationId): Promise<void>;
}
