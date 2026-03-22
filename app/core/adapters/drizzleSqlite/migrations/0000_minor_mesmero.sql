CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`phone_number` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_auth_user_id_unique` ON `customers` (`auth_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `idx_customers_auth_user_id` ON `customers` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `idx_customers_email` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `idx_customers_status` ON `customers` (`status`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`invited_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invitations_tenant_id` ON `invitations` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_invitations_email_status` ON `invitations` (`email`,`status`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`auth_user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone_number` text,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_members_tenant_id` ON `members` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_members_auth_user_id` ON `members` (`auth_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_tenant_auth` ON `members` (`tenant_id`,`auth_user_id`);--> statement-breakpoint
CREATE TABLE `menus` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`description` text,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_menus_tenant_id` ON `menus` (`tenant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_menus_tenant_name` ON `menus` (`tenant_id`,`name`);--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_type` text NOT NULL,
	`recipient_id` text NOT NULL,
	`channel` text NOT NULL,
	`type` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notification_preferences_recipient` ON `notification_preferences` (`recipient_type`,`recipient_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notification_preferences_unique` ON `notification_preferences` (`recipient_type`,`recipient_id`,`channel`,`type`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_type` text NOT NULL,
	`recipient_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`reference_type` text,
	`reference_id` text,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient` ON `notifications` (`recipient_type`,`recipient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient_unread` ON `notifications` (`recipient_type`,`recipient_id`,`is_read`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`processed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_events_unprocessed` ON `outbox_events` (`processed_at`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`customer_id` text,
	`menu_id` text NOT NULL,
	`staff_profile_id` text,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`menu_name` text NOT NULL,
	`menu_duration` integer NOT NULL,
	`menu_price` integer NOT NULL,
	`staff_name` text,
	`customer_name` text,
	`customer_email` text,
	`customer_phone_number` text,
	`note` text,
	`cancellation_reason` text,
	`rejection_reason` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reservations_tenant_date` ON `reservations` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_reservations_tenant_status` ON `reservations` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_reservations_customer_id` ON `reservations` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_reservations_staff_date` ON `reservations` (`staff_profile_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_reservations_status_date` ON `reservations` (`status`,`date`);--> statement-breakpoint
CREATE TABLE `shift_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`staff_profile_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_shift_requests_staff_date` ON `shift_requests` (`staff_profile_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_shift_requests_tenant_date` ON `shift_requests` (`tenant_id`,`date`);--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`staff_profile_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`recurring_group_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_shifts_tenant_date` ON `shifts` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_shifts_staff_date` ON `shifts` (`staff_profile_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_shifts_recurring_group` ON `shifts` (`recurring_group_id`);--> statement-breakpoint
CREATE TABLE `staff_assigned_menus` (
	`staff_profile_id` text NOT NULL,
	`menu_id` text NOT NULL,
	PRIMARY KEY(`staff_profile_id`, `menu_id`),
	FOREIGN KEY (`staff_profile_id`) REFERENCES `staff_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_staff_assigned_menus_menu_id` ON `staff_assigned_menus` (`menu_id`);--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`member_id` text NOT NULL,
	`display_name` text NOT NULL,
	`image_url` text,
	`bio` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_profiles_member_id_unique` ON `staff_profiles` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_profiles_tenant_id` ON `staff_profiles` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_profiles_member_id` ON `staff_profiles` (`member_id`);--> statement-breakpoint
CREATE TABLE `temporary_holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`date` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_temporary_holidays_tenant_date` ON `temporary_holidays` (`tenant_id`,`date`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`url_path` text NOT NULL,
	`postal_code` text NOT NULL,
	`address_prefecture` text NOT NULL,
	`address_city` text NOT NULL,
	`address_street` text NOT NULL,
	`phone_number` text NOT NULL,
	`description` text,
	`image_urls` text DEFAULT '[]' NOT NULL,
	`business_hours` text NOT NULL,
	`regular_holidays` text DEFAULT '[]' NOT NULL,
	`reservation_booking_window_days` integer DEFAULT 30 NOT NULL,
	`reservation_booking_deadline_hours` integer DEFAULT 2 NOT NULL,
	`reservation_cancellation_deadline_hours` integer DEFAULT 24 NOT NULL,
	`reservation_slot_duration_minutes` integer DEFAULT 30 NOT NULL,
	`reservation_buffer_minutes` integer DEFAULT 0 NOT NULL,
	`reservation_approval_method` text DEFAULT 'auto' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_url_path_unique` ON `tenants` (`url_path`);--> statement-breakpoint
CREATE INDEX `idx_tenants_url_path` ON `tenants` (`url_path`);--> statement-breakpoint
CREATE INDEX `idx_tenants_status` ON `tenants` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tenants_category` ON `tenants` (`category`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
