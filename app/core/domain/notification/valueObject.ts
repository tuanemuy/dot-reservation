import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { NotificationErrorCode } from "./errorCode";

// NotificationId
type NotificationId = string & { readonly brand: "NotificationId" };

const NotificationId = {
  create: (id: string): NotificationId => {
    return id as NotificationId;
  },
  generate: (): NotificationId => {
    return uuidv7() as NotificationId;
  },
};

export { NotificationId };

// NotificationPreferenceId
type NotificationPreferenceId = string & {
  readonly brand: "NotificationPreferenceId";
};

const NotificationPreferenceId = {
  create: (id: string): NotificationPreferenceId => {
    return id as NotificationPreferenceId;
  },
  generate: (): NotificationPreferenceId => {
    return uuidv7() as NotificationPreferenceId;
  },
};

export { NotificationPreferenceId };

// RecipientType
type RecipientType = "customer" | "member";

const VALID_RECIPIENT_TYPES: ReadonlySet<string> = new Set([
  "customer",
  "member",
]);

const RecipientType = {
  create: (value: string): RecipientType => {
    if (!VALID_RECIPIENT_TYPES.has(value)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidRecipientType,
        "Invalid recipient type",
      );
    }
    return value as RecipientType;
  },
};

export { RecipientType };

// NotificationChannel
type NotificationChannel = "email" | "in_app";

const VALID_CHANNELS: ReadonlySet<string> = new Set(["email", "in_app"]);

const NotificationChannel = {
  create: (value: string): NotificationChannel => {
    if (!VALID_CHANNELS.has(value)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidChannel,
        "Invalid notification channel",
      );
    }
    return value as NotificationChannel;
  },
};

export { NotificationChannel };

// NotificationType
type NotificationType =
  | "reservation_confirmed"
  | "reservation_updated"
  | "reservation_cancelled"
  | "reservation_reminder"
  | "reservation_pending"
  | "reservation_approved"
  | "reservation_rejected"
  | "new_reservation"
  | "reservation_updated_by_customer"
  | "reservation_cancelled_by_customer"
  | "invitation_received"
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "shift_request_submitted";

const VALID_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  "reservation_confirmed",
  "reservation_updated",
  "reservation_cancelled",
  "reservation_reminder",
  "reservation_pending",
  "reservation_approved",
  "reservation_rejected",
  "new_reservation",
  "reservation_updated_by_customer",
  "reservation_cancelled_by_customer",
  "invitation_received",
  "member_joined",
  "member_left",
  "member_removed",
  "shift_request_submitted",
]);

const NotificationType = {
  create: (value: string): NotificationType => {
    if (!VALID_NOTIFICATION_TYPES.has(value)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidNotificationType,
        "Invalid notification type",
      );
    }
    return value as NotificationType;
  },
};

export { NotificationType };
