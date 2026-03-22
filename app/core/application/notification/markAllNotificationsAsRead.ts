import type { RecipientType } from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";

export type MarkAllNotificationsAsReadInput = {
  recipientType: string;
  recipientId: string;
};

export type MarkAllNotificationsAsReadOutput = undefined;

export async function markAllNotificationsAsRead({
  container,
  input,
}: ServiceArgs<MarkAllNotificationsAsReadInput>): Promise<MarkAllNotificationsAsReadOutput> {
  const recipientType = input.recipientType as RecipientType;

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    await repositories.notificationRepository.markAllAsRead(
      recipientType,
      input.recipientId,
    );
  });

  return undefined;
}
