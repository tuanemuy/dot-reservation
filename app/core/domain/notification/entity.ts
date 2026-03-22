import { BusinessRuleError } from "@/core/domain/error";
import { NotificationErrorCode } from "./errorCode";
import {
  type NotificationChannel,
  NotificationId,
  type NotificationId as NotificationIdType,
  NotificationPreferenceId,
  type NotificationPreferenceId as NotificationPreferenceIdType,
  type NotificationType,
  type RecipientType,
} from "./valueObject";

// Notification

type Notification = Readonly<{
  id: NotificationIdType;
  recipientType: RecipientType;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}>;

export type { Notification };

export const Notification = {
  create: (params: {
    recipientType: RecipientType;
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceType: string | null;
    referenceId: string | null;
  }): Notification => {
    return {
      id: NotificationId.generate(),
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      isRead: false,
      createdAt: new Date(),
    };
  },

  markAsRead: (notification: Notification): Notification => {
    if (notification.isRead) {
      throw new BusinessRuleError(
        NotificationErrorCode.AlreadyRead,
        "Notification is already read",
      );
    }

    return {
      ...notification,
      isRead: true,
    };
  },
};

// NotificationPreference

type NotificationPreference = Readonly<{
  id: NotificationPreferenceIdType;
  recipientType: RecipientType;
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
  updatedAt: Date;
}>;

export type { NotificationPreference };

export const NotificationPreference = {
  create: (params: {
    recipientType: RecipientType;
    recipientId: string;
    channel: NotificationChannel;
    type: NotificationType;
    enabled: boolean;
  }): NotificationPreference => {
    return {
      id: NotificationPreferenceId.generate(),
      recipientType: params.recipientType,
      recipientId: params.recipientId,
      channel: params.channel,
      type: params.type,
      enabled: params.enabled,
      updatedAt: new Date(),
    };
  },

  update: (
    preference: NotificationPreference,
    enabled: boolean,
  ): NotificationPreference => {
    return {
      ...preference,
      enabled,
      updatedAt: new Date(),
    };
  },
};
