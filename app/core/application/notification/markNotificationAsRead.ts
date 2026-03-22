import { isBusinessRuleError } from "@/core/domain/error";
import { Notification as NotificationEntity } from "@/core/domain/notification/entity";
import { NotificationErrorCode } from "@/core/domain/notification/errorCode";
import { NotificationId } from "@/core/domain/notification/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type MarkNotificationAsReadInput = {
  notificationId: string;
};

export type MarkNotificationAsReadOutput = undefined;

export async function markNotificationAsRead({
  container,
  input,
}: ServiceArgs<MarkNotificationAsReadInput>): Promise<MarkNotificationAsReadOutput> {
  const notificationId = NotificationId.create(input.notificationId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const notification =
      await repositories.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Notification not found",
      );
    }

    try {
      const updatedNotification = NotificationEntity.markAsRead(notification);
      await repositories.notificationRepository.save(updatedNotification);
    } catch (error: unknown) {
      // If already read, treat as success per specification
      if (
        isBusinessRuleError(error) &&
        error.code === NotificationErrorCode.AlreadyRead
      ) {
        return;
      }
      throw error;
    }
  });

  return undefined;
}
