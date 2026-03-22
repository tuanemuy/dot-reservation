import type { Email } from "@/core/domain/common/valueObject";
import type { Invitation } from "@/core/domain/member/entity";

export interface EmailSender {
  sendInvitationEmail(
    email: Email,
    invitation: Invitation,
    tenantName: string,
  ): Promise<void>;
}
