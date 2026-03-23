import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * users - 認証用ユーザーテーブル（better-auth 管理）
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    role: text("role").notNull().default("user"),
    banned: integer("banned", { mode: "boolean" }).notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("idx_users_email").on(table.email)],
);

/**
 * sessions - セッションテーブル（better-auth 管理）
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    uniqueIndex("idx_sessions_token").on(table.token),
  ],
);

/**
 * accounts - 認証アカウントテーブル（better-auth 管理）
 */
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_accounts_user_id").on(table.userId)],
);

/**
 * verifications - メール確認・パスワードリセットトークンテーブル（better-auth 管理）
 */
export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_verifications_identifier").on(table.identifier)],
);

/**
 * customers - 顧客テーブル
 */
export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id").notNull().unique(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull().unique(),
    phoneNumber: text("phone_number"),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_customers_auth_user_id").on(table.authUserId),
    index("idx_customers_email").on(table.email),
    index("idx_customers_status").on(table.status),
  ],
);

/**
 * tenants - テナント（店舗）テーブル
 */
export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    urlPath: text("url_path").notNull().unique(),
    postalCode: text("postal_code").notNull(),
    addressPrefecture: text("address_prefecture").notNull(),
    addressCity: text("address_city").notNull(),
    addressStreet: text("address_street").notNull(),
    phoneNumber: text("phone_number").notNull(),
    description: text("description"),
    imageUrls: text("image_urls").notNull().default("[]"),
    businessHours: text("business_hours").notNull(),
    regularHolidays: text("regular_holidays").notNull().default("[]"),
    reservationBookingWindowDays: integer("reservation_booking_window_days")
      .notNull()
      .default(30),
    reservationBookingDeadlineHours: integer(
      "reservation_booking_deadline_hours",
    )
      .notNull()
      .default(2),
    reservationCancellationDeadlineHours: integer(
      "reservation_cancellation_deadline_hours",
    )
      .notNull()
      .default(24),
    reservationSlotDurationMinutes: integer("reservation_slot_duration_minutes")
      .notNull()
      .default(30),
    reservationBufferMinutes: integer("reservation_buffer_minutes")
      .notNull()
      .default(0),
    reservationApprovalMethod: text("reservation_approval_method")
      .notNull()
      .default("auto"),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_tenants_url_path").on(table.urlPath),
    index("idx_tenants_status").on(table.status),
    index("idx_tenants_category").on(table.category),
  ],
);

/**
 * temporary_holidays - 臨時休業日テーブル
 */
export const temporaryHolidays = sqliteTable(
  "temporary_holidays",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    date: text("date").notNull(),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("idx_temporary_holidays_tenant_date").on(
      table.tenantId,
      table.date,
    ),
  ],
);

/**
 * members - テナントメンバーテーブル
 */
export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    authUserId: text("auth_user_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number"),
    role: text("role").notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_members_tenant_id").on(table.tenantId),
    index("idx_members_auth_user_id").on(table.authUserId),
    uniqueIndex("idx_members_tenant_auth").on(table.tenantId, table.authUserId),
  ],
);

/**
 * invitations - テナントへの招待テーブル
 */
export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: text("email").notNull(),
    role: text("role").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => members.id),
    status: text("status").notNull().default("pending"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_invitations_tenant_id").on(table.tenantId),
    index("idx_invitations_email_status").on(table.email, table.status),
  ],
);

/**
 * menus - メニューテーブル
 */
export const menus = sqliteTable(
  "menus",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    duration: integer("duration").notNull(),
    price: integer("price").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_menus_tenant_id").on(table.tenantId),
    uniqueIndex("idx_menus_tenant_name").on(table.tenantId, table.name),
  ],
);

/**
 * staff_profiles - スタッフプロフィールテーブル
 */
export const staffProfiles = sqliteTable(
  "staff_profiles",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    memberId: text("member_id")
      .notNull()
      .unique()
      .references(() => members.id),
    displayName: text("display_name").notNull(),
    imageUrl: text("image_url"),
    bio: text("bio"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_staff_profiles_tenant_id").on(table.tenantId),
    index("idx_staff_profiles_member_id").on(table.memberId),
  ],
);

/**
 * staff_assigned_menus - スタッフ担当メニュー中間テーブル
 */
export const staffAssignedMenus = sqliteTable(
  "staff_assigned_menus",
  {
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id),
    menuId: text("menu_id")
      .notNull()
      .references(() => menus.id),
  },
  (table) => [
    primaryKey({ columns: [table.staffProfileId, table.menuId] }),
    index("idx_staff_assigned_menus_menu_id").on(table.menuId),
  ],
);

/**
 * shifts - シフトテーブル
 */
export const shifts = sqliteTable(
  "shifts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    recurringGroupId: text("recurring_group_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_shifts_tenant_date").on(table.tenantId, table.date),
    index("idx_shifts_staff_date").on(table.staffProfileId, table.date),
    index("idx_shifts_recurring_group").on(table.recurringGroupId),
  ],
);

/**
 * shift_requests - シフト希望テーブル
 */
export const shiftRequests = sqliteTable(
  "shift_requests",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    staffProfileId: text("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id),
    date: text("date").notNull(),
    type: text("type").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_shift_requests_staff_date").on(table.staffProfileId, table.date),
    index("idx_shift_requests_tenant_date").on(table.tenantId, table.date),
  ],
);

/**
 * reservations - 予約テーブル
 */
export const reservations = sqliteTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    customerId: text("customer_id").references(() => customers.id),
    menuId: text("menu_id").notNull(),
    staffProfileId: text("staff_profile_id"),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: text("status").notNull().default("pending"),
    menuName: text("menu_name").notNull(),
    menuDuration: integer("menu_duration").notNull(),
    menuPrice: integer("menu_price").notNull(),
    staffName: text("staff_name"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    customerPhoneNumber: text("customer_phone_number"),
    note: text("note"),
    cancellationReason: text("cancellation_reason"),
    rejectionReason: text("rejection_reason"),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_reservations_tenant_date").on(table.tenantId, table.date),
    index("idx_reservations_tenant_status").on(table.tenantId, table.status),
    index("idx_reservations_customer_id").on(table.customerId),
    index("idx_reservations_staff_date").on(table.staffProfileId, table.date),
    index("idx_reservations_status_date").on(table.status, table.date),
  ],
);

/**
 * notifications - 通知テーブル
 */
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    recipientType: text("recipient_type").notNull(),
    recipientId: text("recipient_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    isRead: integer("is_read").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_notifications_recipient").on(
      table.recipientType,
      table.recipientId,
      table.createdAt,
    ),
    index("idx_notifications_recipient_unread").on(
      table.recipientType,
      table.recipientId,
      table.isRead,
    ),
  ],
);

/**
 * notification_preferences - 通知設定テーブル
 */
export const notificationPreferences = sqliteTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    recipientType: text("recipient_type").notNull(),
    recipientId: text("recipient_id").notNull(),
    channel: text("channel").notNull(),
    type: text("type").notNull(),
    enabled: integer("enabled").notNull().default(1),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_notification_preferences_recipient").on(
      table.recipientType,
      table.recipientId,
    ),
    uniqueIndex("idx_notification_preferences_unique").on(
      table.recipientType,
      table.recipientId,
      table.channel,
      table.type,
    ),
  ],
);

/**
 * outbox_events - Outboxイベントテーブル
 */
export const outboxEvents = sqliteTable(
  "outbox_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    payload: text("payload").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    processedAt: integer("processed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_outbox_events_unprocessed").on(table.processedAt)],
);
