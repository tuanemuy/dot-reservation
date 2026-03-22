import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { Notification } from "@/core/domain/notification/entity";
import type { RecipientType } from "@/core/domain/notification/valueObject";

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findByRecipient(
    recipientType: RecipientType,
    recipientId: string,
    filter: NotificationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Notification>>;
  countUnreadByRecipient(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<number>;
  markAllAsRead(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<void>;
}

export type NotificationFilter = {
  readonly isRead?: boolean;
};
