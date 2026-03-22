import { isBusinessRuleError } from "@/core/domain/error";
import type { Notification as DomainNotification } from "@/core/domain/notification/entity";
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
    // findById returns the domain Notification type, but due to global DOM
    // Notification type collision, we cast to the domain type explicitly
    const notification = (await repositories.notificationRepository.findById(
      notificationId,
    )) as DomainNotification | null;
    if (!notification) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Notification not found",
      );
    }

    try {
      const updatedNotification = NotificationEntity.markAsRead(notification);
      await repositories.notificationRepository.save(
        updatedNotification as never,
      );
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
