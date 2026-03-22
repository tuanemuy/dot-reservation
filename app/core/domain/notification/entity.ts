import { BusinessRuleError } from "@/core/domain/error";
import { NotificationErrorCode } from "./errorCode";
import type {
  NotificationChannel as NotificationChannelType,
  NotificationId as NotificationIdType,
  NotificationPreferenceId as NotificationPreferenceIdType,
  NotificationType as NotificationTypeType,
  RecipientType as RecipientTypeType,
} from "./valueObject";
import { NotificationId, NotificationPreferenceId } from "./valueObject";

// Notification

type Notification = Readonly<{
  id: NotificationIdType;
  recipientType: RecipientTypeType;
  recipientId: string;
  type: NotificationTypeType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: Date;
}>;

const Notification = {
  create: (params: {
    recipientType: RecipientTypeType;
    recipientId: string;
    type: NotificationTypeType;
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

export { Notification };

// NotificationPreference

type NotificationPreference = Readonly<{
  id: NotificationPreferenceIdType;
  recipientType: RecipientTypeType;
  recipientId: string;
  channel: NotificationChannelType;
  type: NotificationTypeType;
  enabled: boolean;
  updatedAt: Date;
}>;

const NotificationPreference = {
  create: (params: {
    recipientType: RecipientTypeType;
    recipientId: string;
    channel: NotificationChannelType;
    type: NotificationTypeType;
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

export { NotificationPreference };
