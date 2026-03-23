import type { Transporter } from "nodemailer";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Notification } from "@/core/domain/notification/entity";
import type { EmailSender } from "@/core/domain/notification/ports/emailSender";

export class NodemailerNotificationEmailSender implements EmailSender {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
  ) {}

  async sendNotificationEmail(
    email: string,
    notification: Notification,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: notification.title,
        text: notification.message,
        html: [
          `<h2>${notification.title}</h2>`,
          `<p>${notification.message}</p>`,
        ].join("\n"),
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.NetworkError,
        "Failed to send notification email",
        error,
      );
    }
  }
}
