import type { Transporter } from "nodemailer";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Email } from "@/core/domain/common/valueObject";
import type { Invitation } from "@/core/domain/member/entity";
import type { EmailSender } from "@/core/domain/member/ports/emailSender";

export class NodemailerMemberEmailSender implements EmailSender {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
    private readonly appUrl: string,
  ) {}

  async sendInvitationEmail(
    email: Email,
    invitation: Invitation,
    tenantName: string,
  ): Promise<void> {
    const invitationUrl = `${this.appUrl}/invitations/${invitation.id}`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: `${tenantName} への招待`,
        text: [
          `${tenantName} に招待されました。`,
          "",
          `ロール: ${invitation.role}`,
          `有効期限: ${invitation.expiresAt.toLocaleDateString("ja-JP")}`,
          "",
          "以下のリンクから招待を確認してください。",
          "",
          invitationUrl,
        ].join("\n"),
        html: [
          `<p>${tenantName} に招待されました。</p>`,
          `<p>ロール: ${invitation.role}</p>`,
          `<p>有効期限: ${invitation.expiresAt.toLocaleDateString("ja-JP")}</p>`,
          "<p>以下のリンクから招待を確認してください。</p>",
          `<p><a href="${invitationUrl}">${invitationUrl}</a></p>`,
        ].join("\n"),
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        "Failed to send invitation email",
        error,
      );
    }
  }
}
