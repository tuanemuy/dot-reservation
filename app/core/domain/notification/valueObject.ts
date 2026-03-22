import { v7 as uuidv7 } from "uuid";

// NotificationId
type NotificationId = string & { readonly brand: "NotificationId" };

export type { NotificationId };

export const NotificationId = {
  create: (id: string): NotificationId => {
    return id as NotificationId;
  },
  generate: (): NotificationId => {
    return uuidv7() as NotificationId;
  },
};

// NotificationPreferenceId
type NotificationPreferenceId = string & {
  readonly brand: "NotificationPreferenceId";
};

export type { NotificationPreferenceId };

export const NotificationPreferenceId = {
  create: (id: string): NotificationPreferenceId => {
    return id as NotificationPreferenceId;
  },
  generate: (): NotificationPreferenceId => {
    return uuidv7() as NotificationPreferenceId;
  },
};

// RecipientType
type RecipientType = "customer" | "member";

export type { RecipientType };

// NotificationChannel
type NotificationChannel = "email" | "in_app";

export type { NotificationChannel };

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
  | "shift_request_submitted";

export type { NotificationType };
