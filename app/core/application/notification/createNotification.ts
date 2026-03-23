import { CustomerId } from "@/core/domain/customer/valueObject";
import { MemberId } from "@/core/domain/member/valueObject";
import { Notification as NotificationEntity } from "@/core/domain/notification/entity";
import type {
  NotificationType as NotificationTypeVO,
  RecipientType,
} from "@/core/domain/notification/valueObject";
import type { Container } from "../container/server";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

/**
 * Important notification types that are always created as in-app notifications
 * regardless of user preferences.
 */
const IMPORTANT_NOTIFICATION_TYPES: ReadonlySet<NotificationTypeVO> = new Set([
  "reservation_confirmed",
  "reservation_cancelled",
  "reservation_approved",
  "reservation_rejected",
]);

export type CreateNotificationInput = {
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
};

export type CreateNotificationOutput = {
  id: string;
};

export async function createNotification({
  container,
  input,
}: ServiceArgs<CreateNotificationInput>): Promise<CreateNotificationOutput> {
  if (input.message.trim() === "") {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Notification message cannot be empty",
    );
  }

  const recipientType = input.recipientType as RecipientType;
  const notificationType = input.type as NotificationTypeVO;

  // Verify recipient exists
  if (recipientType === "customer") {
    const customer = await container.customerRepository.findById(
      CustomerId.create(input.recipientId),
    );
    if (!customer) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Recipient customer not found",
      );
    }
  } else {
    const member = await container.memberRepository.findById(
      MemberId.create(input.recipientId),
    );
    if (!member) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Recipient member not found",
      );
    }
  }

  const isImportant = IMPORTANT_NOTIFICATION_TYPES.has(notificationType);

  // Check notification preferences
  const inAppPreference =
    await container.notificationPreferenceRepository.findByRecipientAndChannelAndType(
      recipientType,
      input.recipientId,
      "in_app",
      notificationType,
    );

  const emailPreference =
    await container.notificationPreferenceRepository.findByRecipientAndChannelAndType(
      recipientType,
      input.recipientId,
      "email",
      notificationType,
    );

  // Determine whether to send in-app notification
  // Default: enabled (when no preference record exists)
  const inAppEnabled = inAppPreference ? inAppPreference.enabled : true;
  const shouldCreateInApp = isImportant || inAppEnabled;

  // Determine whether to send email
  // Default: enabled (when no preference record exists)
  const emailEnabled = emailPreference ? emailPreference.enabled : true;

  if (!shouldCreateInApp && !emailEnabled) {
    // Both in-app and email are disabled, and notification is not important
    return { id: "" };
  }

  const notification = NotificationEntity.create({
    recipientType,
    recipientId: input.recipientId,
    type: notificationType,
    title: input.title,
    message: input.message,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  });

  if (shouldCreateInApp) {
    await container.unitOfWorkProvider.transaction(async (repositories) => {
      await repositories.notificationRepository.save(notification);
    });
  }

  if (emailEnabled) {
    const email = await resolveRecipientEmail(
      container,
      recipientType,
      input.recipientId,
    );
    if (email) {
      await container.notificationEmailSender.sendNotificationEmail(
        email,
        notification,
      );
    }
  }

  return {
    id: notification.id,
  };
}

async function resolveRecipientEmail(
  container: Container,
  recipientType: RecipientType,
  recipientId: string,
): Promise<string | null> {
  if (recipientType === "customer") {
    const customer = await container.customerRepository.findById(
      CustomerId.create(recipientId),
    );
    return customer?.email ?? null;
  }

  const member = await container.memberRepository.findById(
    MemberId.create(recipientId),
  );
  return member?.email ?? null;
}
