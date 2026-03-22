import type { RecipientType } from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";

export type GetUnreadNotificationCountInput = {
  recipientType: string;
  recipientId: string;
};

export type GetUnreadNotificationCountOutput = {
  count: number;
};

export async function getUnreadNotificationCount({
  container,
  input,
}: ServiceArgs<GetUnreadNotificationCountInput>): Promise<GetUnreadNotificationCountOutput> {
  const recipientType = input.recipientType as RecipientType;

  const count = await container.notificationRepository.countUnreadByRecipient(
    recipientType,
    input.recipientId,
  );

  return { count };
}
