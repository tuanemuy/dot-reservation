import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type { RecipientType } from "@/core/domain/notification/valueObject";

export type GetNotificationPreferencesInput = {
  recipientType: string;
  recipientId: string;
};

export type NotificationPreferenceItem = {
  channel: string;
  type: string;
  enabled: boolean;
};

export type GetNotificationPreferencesOutput = {
  preferences: NotificationPreferenceItem[];
};

type GetNotificationPreferencesArgs = {
  container: {
    notificationPreferenceRepository: NotificationPreferenceRepository;
  };
  headers: Headers;
  input: GetNotificationPreferencesInput;
};

/**
 * All notification types and channels with their default enabled state.
 * Used to return defaults for preferences that haven't been explicitly set.
 */
const DEFAULT_PREFERENCES: ReadonlyArray<{
  channel: string;
  type: string;
  enabled: boolean;
}> = [
  { channel: "in_app", type: "reservation_confirmed", enabled: true },
  { channel: "in_app", type: "reservation_updated", enabled: true },
  { channel: "in_app", type: "reservation_cancelled", enabled: true },
  { channel: "in_app", type: "reservation_reminder", enabled: true },
  { channel: "in_app", type: "reservation_pending", enabled: true },
  { channel: "in_app", type: "reservation_approved", enabled: true },
  { channel: "in_app", type: "reservation_rejected", enabled: true },
  { channel: "in_app", type: "new_reservation", enabled: true },
  { channel: "in_app", type: "reservation_updated_by_customer", enabled: true },
  {
    channel: "in_app",
    type: "reservation_cancelled_by_customer",
    enabled: true,
  },
  { channel: "in_app", type: "invitation_received", enabled: true },
  { channel: "in_app", type: "member_joined", enabled: true },
  { channel: "in_app", type: "member_left", enabled: true },
  { channel: "in_app", type: "shift_request_submitted", enabled: true },
  { channel: "email", type: "reservation_confirmed", enabled: true },
  { channel: "email", type: "reservation_updated", enabled: true },
  { channel: "email", type: "reservation_cancelled", enabled: true },
  { channel: "email", type: "reservation_reminder", enabled: true },
  { channel: "email", type: "reservation_pending", enabled: true },
  { channel: "email", type: "reservation_approved", enabled: true },
  { channel: "email", type: "reservation_rejected", enabled: true },
  { channel: "email", type: "new_reservation", enabled: true },
  { channel: "email", type: "reservation_updated_by_customer", enabled: true },
  {
    channel: "email",
    type: "reservation_cancelled_by_customer",
    enabled: true,
  },
  { channel: "email", type: "invitation_received", enabled: true },
  { channel: "email", type: "member_joined", enabled: true },
  { channel: "email", type: "member_left", enabled: true },
  { channel: "email", type: "shift_request_submitted", enabled: true },
];

export async function getNotificationPreferences({
  container,
  input,
}: GetNotificationPreferencesArgs): Promise<GetNotificationPreferencesOutput> {
  const recipientType = input.recipientType as RecipientType;

  const savedPreferences =
    await container.notificationPreferenceRepository.findByRecipient(
      recipientType,
      input.recipientId,
    );

  // Build a lookup map: "channel:type" -> enabled
  const savedMap = new Map<string, boolean>();
  for (const pref of savedPreferences) {
    savedMap.set(`${pref.channel}:${pref.type}`, pref.enabled);
  }

  // Merge saved preferences with defaults
  const preferences = DEFAULT_PREFERENCES.map((defaultPref) => {
    const key = `${defaultPref.channel}:${defaultPref.type}`;
    const savedEnabled = savedMap.get(key);
    return {
      channel: defaultPref.channel,
      type: defaultPref.type,
      enabled: savedEnabled !== undefined ? savedEnabled : defaultPref.enabled,
    };
  });

  return { preferences };
}
