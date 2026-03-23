import type { InferSelectModel } from "drizzle-orm";
import { and, eq, inArray, sql } from "drizzle-orm";
import { notifications } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { Notification as NotificationType } from "@/core/domain/notification/entity";
import type {
  NotificationFilter,
  NotificationRepository,
} from "@/core/domain/notification/ports/notificationRepository";
import type {
  NotificationId as NotificationIdType,
  NotificationType as NotificationTypeType,
  RecipientType as RecipientTypeType,
} from "@/core/domain/notification/valueObject";
import type { Executor } from "../client";

type NotificationDataModel = InferSelectModel<typeof notifications>;

export class DrizzleSqliteNotificationRepository
  implements NotificationRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: NotificationDataModel): NotificationType {
    return {
      id: data.id as NotificationIdType,
      recipientType: data.recipientType as RecipientTypeType,
      recipientId: data.recipientId,
      type: data.type as NotificationTypeType,
      title: data.title,
      message: data.message,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      isRead: data.isRead === 1,
      createdAt: data.createdAt,
    };
  }

  async findById(id: NotificationIdType): Promise<NotificationType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(notifications)
        .where(eq(notifications.id, id))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      return this.into(rows[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification by id",
        error,
      );
    }
  }

  async save(notification: NotificationType): Promise<void> {
    try {
      await this.executor
        .insert(notifications)
        .values({
          id: notification.id,
          recipientType: notification.recipientType,
          recipientId: notification.recipientId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          referenceType: notification.referenceType,
          referenceId: notification.referenceId,
          isRead: notification.isRead ? 1 : 0,
          createdAt: notification.createdAt,
        })
        .onConflictDoUpdate({
          target: notifications.id,
          set: {
            recipientType: notification.recipientType,
            recipientId: notification.recipientId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            referenceType: notification.referenceType,
            referenceId: notification.referenceId,
            isRead: notification.isRead ? 1 : 0,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notification",
        error,
      );
    }
  }

  async findByRecipient(
    recipientType: RecipientTypeType,
    recipientId: string,
    filter: NotificationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<NotificationType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [
        eq(notifications.recipientType, recipientType),
        eq(notifications.recipientId, recipientId),
      ];

      if (filter.isRead !== undefined) {
        conditions.push(eq(notifications.isRead, filter.isRead ? 1 : 0));
      }

      if (filter.type !== undefined) {
        conditions.push(eq(notifications.type, filter.type));
      }

      if (filter.types !== undefined && filter.types.length > 0) {
        conditions.push(inArray(notifications.type, [...filter.types]));
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(sql`${notifications.createdAt} DESC`)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notifications by recipient",
        error,
      );
    }
  }

  async countUnreadByRecipient(
    recipientType: RecipientTypeType,
    recipientId: string,
  ): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientType, recipientType),
            eq(notifications.recipientId, recipientId),
            eq(notifications.isRead, 0),
          ),
        );

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count unread notifications",
        error,
      );
    }
  }

  async markAllAsRead(
    recipientType: RecipientTypeType,
    recipientId: string,
  ): Promise<void> {
    try {
      await this.executor
        .update(notifications)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notifications.recipientType, recipientType),
            eq(notifications.recipientId, recipientId),
            eq(notifications.isRead, 0),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to mark all notifications as read",
        error,
      );
    }
  }
}
