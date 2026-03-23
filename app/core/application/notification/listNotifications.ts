import type {
  NotificationType as NotificationTypeVO,
  RecipientType,
} from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";

export type ListNotificationsInput = {
  recipientType: string;
  recipientId: string;
  typeFilter: string | null;
  typeFilters: readonly string[] | null;
  page: number;
  limit: number;
};

export type NotificationDetail = {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type ListNotificationsOutput = {
  items: NotificationDetail[];
  totalCount: number;
};

export async function listNotifications({
  container,
  input,
}: ServiceArgs<ListNotificationsInput>): Promise<ListNotificationsOutput> {
  const recipientType = input.recipientType as RecipientType;

  const result = await container.notificationRepository.findByRecipient(
    recipientType,
    input.recipientId,
    {
      type: input.typeFilter
        ? (input.typeFilter as NotificationTypeVO)
        : undefined,
      types:
        input.typeFilters && input.typeFilters.length > 0
          ? (input.typeFilters as NotificationTypeVO[])
          : undefined,
    },
    {
      page: input.page,
      limit: input.limit,
    },
  );

  return {
    items: result.items.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })),
    totalCount: result.total,
  };
}
