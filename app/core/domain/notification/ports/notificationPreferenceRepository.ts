import type { NotificationPreference } from "@/core/domain/notification/entity";
import type {
  NotificationChannel,
  NotificationType,
  RecipientType,
} from "@/core/domain/notification/valueObject";

export interface NotificationPreferenceRepository {
  save(preference: NotificationPreference): Promise<void>;
  findByRecipient(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<NotificationPreference[]>;
  findByRecipientAndChannelAndType(
    recipientType: RecipientType,
    recipientId: string,
    channel: NotificationChannel,
    type: NotificationType,
  ): Promise<NotificationPreference | null>;
}
