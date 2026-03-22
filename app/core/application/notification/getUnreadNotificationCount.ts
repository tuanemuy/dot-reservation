import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type { RecipientType } from "@/core/domain/notification/valueObject";

export type GetUnreadNotificationCountInput = {
  recipientType: string;
  recipientId: string;
};

export type GetUnreadNotificationCountOutput = {
  count: number;
};

type GetUnreadNotificationCountArgs = {
  container: {
    notificationRepository: NotificationRepository;
  };
  headers: Headers;
  input: GetUnreadNotificationCountInput;
};

export async function getUnreadNotificationCount({
  container,
  input,
}: GetUnreadNotificationCountArgs): Promise<GetUnreadNotificationCountOutput> {
  const recipientType = input.recipientType as RecipientType;

  const count = await container.notificationRepository.countUnreadByRecipient(
    recipientType,
    input.recipientId,
  );

  return { count };
}
