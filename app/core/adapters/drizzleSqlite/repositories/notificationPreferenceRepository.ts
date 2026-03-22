import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { notificationPreferences } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { NotificationPreference as NotificationPreferenceType } from "@/core/domain/notification/entity";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type {
  NotificationChannel as NotificationChannelType,
  NotificationPreferenceId as NotificationPreferenceIdType,
  NotificationType as NotificationTypeType,
  RecipientType as RecipientTypeType,
} from "@/core/domain/notification/valueObject";
import type { Executor } from "../client";

type NotificationPreferenceDataModel = InferSelectModel<
  typeof notificationPreferences
>;

export class DrizzleSqliteNotificationPreferenceRepository
  implements NotificationPreferenceRepository
{
  constructor(private readonly executor: Executor) {}

  private into(
    data: NotificationPreferenceDataModel,
  ): NotificationPreferenceType {
    return {
      id: data.id as NotificationPreferenceIdType,
      recipientType: data.recipientType as RecipientTypeType,
      recipientId: data.recipientId,
      channel: data.channel as NotificationChannelType,
      type: data.type as NotificationTypeType,
      enabled: data.enabled === 1,
      updatedAt: data.updatedAt,
    };
  }

  async save(preference: NotificationPreferenceType): Promise<void> {
    try {
      await this.executor
        .insert(notificationPreferences)
        .values({
          id: preference.id,
          recipientType: preference.recipientType,
          recipientId: preference.recipientId,
          channel: preference.channel,
          type: preference.type,
          enabled: preference.enabled ? 1 : 0,
          updatedAt: preference.updatedAt,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.id,
          set: {
            recipientType: preference.recipientType,
            recipientId: preference.recipientId,
            channel: preference.channel,
            type: preference.type,
            enabled: preference.enabled ? 1 : 0,
            updatedAt: preference.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notification preference",
        error,
      );
    }
  }

  async findByRecipient(
    recipientType: RecipientTypeType,
    recipientId: string,
  ): Promise<NotificationPreferenceType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.recipientType, recipientType),
            eq(notificationPreferences.recipientId, recipientId),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification preferences by recipient",
        error,
      );
    }
  }

  async findByRecipientAndChannelAndType(
    recipientType: RecipientTypeType,
    recipientId: string,
    channel: NotificationChannelType,
    type: NotificationTypeType,
  ): Promise<NotificationPreferenceType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.recipientType, recipientType),
            eq(notificationPreferences.recipientId, recipientId),
            eq(notificationPreferences.channel, channel),
            eq(notificationPreferences.type, type),
          ),
        )
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification preference by recipient, channel, and type",
        error,
      );
    }
  }
}
