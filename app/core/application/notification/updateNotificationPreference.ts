import { NotificationPreference } from "@/core/domain/notification/entity";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type {
  NotificationChannel,
  NotificationType,
  RecipientType,
} from "@/core/domain/notification/valueObject";
import { ConflictError, ConflictErrorCode } from "../error";

export type UpdateNotificationPreferenceInput = {
  recipientType: string;
  recipientId: string;
  channel: string;
  type: string;
  enabled: boolean;
};

export type UpdateNotificationPreferenceOutput = undefined;

/**
 * Important notification types whose in-app channel cannot be disabled.
 */
const IMPORTANT_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  "reservation_confirmed",
  "reservation_cancelled",
  "reservation_approved",
  "reservation_rejected",
]);

type UpdateNotificationPreferenceArgs = {
  container: {
    notificationPreferenceRepository: NotificationPreferenceRepository;
  };
  headers: Headers;
  input: UpdateNotificationPreferenceInput;
};

export async function updateNotificationPreference({
  container,
  input,
}: UpdateNotificationPreferenceArgs): Promise<UpdateNotificationPreferenceOutput> {
  const recipientType = input.recipientType as RecipientType;
  const channel = input.channel as NotificationChannel;
  const notificationType = input.type as NotificationType;

  // Important notifications cannot have in-app disabled
  if (
    channel === "in_app" &&
    !input.enabled &&
    IMPORTANT_NOTIFICATION_TYPES.has(notificationType)
  ) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Cannot disable in-app notifications for important notification types",
    );
  }

  const existing =
    await container.notificationPreferenceRepository.findByRecipientAndChannelAndType(
      recipientType,
      input.recipientId,
      channel,
      notificationType,
    );

  if (existing) {
    const updated = NotificationPreference.update(existing, input.enabled);
    await container.notificationPreferenceRepository.save(updated);
  } else {
    const preference = NotificationPreference.create({
      recipientType,
      recipientId: input.recipientId,
      channel,
      type: notificationType,
      enabled: input.enabled,
    });
    await container.notificationPreferenceRepository.save(preference);
  }

  return undefined;
}
