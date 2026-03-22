import type { Notification } from "@/core/domain/notification/entity";

export interface EmailSender {
  sendNotificationEmail(
    email: string,
    notification: Notification,
  ): Promise<void>;
}
