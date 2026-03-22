import type { Notification as DomainNotification } from "@/core/domain/notification/entity";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type {
  NotificationType as NotificationTypeVO,
  RecipientType,
} from "@/core/domain/notification/valueObject";

export type ListNotificationsInput = {
  recipientType: string;
  recipientId: string;
  typeFilter: string | null;
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

type ListNotificationsArgs = {
  container: {
    notificationRepository: NotificationRepository;
  };
  headers: Headers;
  input: ListNotificationsInput;
};

export async function listNotifications({
  container,
  input,
}: ListNotificationsArgs): Promise<ListNotificationsOutput> {
  const recipientType = input.recipientType as RecipientType;

  const result = await container.notificationRepository.findByRecipient(
    recipientType,
    input.recipientId,
    {
      type: input.typeFilter
        ? (input.typeFilter as NotificationTypeVO)
        : undefined,
    },
    {
      page: input.page,
      limit: input.limit,
    },
  );

  // Cast items due to global DOM Notification type collision
  const items = result.items as readonly DomainNotification[];

  return {
    items: items.map((notification) => ({
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
