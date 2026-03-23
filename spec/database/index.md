# DB設計

技術: Turso (SQLite) + Drizzle ORM

## テーブル一覧

| テーブル名 | ドメイン | 説明 |
|---|---|---|
| customers | Customer | 顧客アカウント |
| tenants | Tenant | テナント（店舗） |
| temporary_holidays | Tenant | 臨時休業日 |
| members | Member | テナントメンバー |
| invitations | Member | テナントへの招待 |
| menus | Menu | メニュー |
| staff_profiles | Staff | スタッフプロフィール |
| staff_assigned_menus | Staff | スタッフ担当メニュー（中間テーブル） |
| shifts | Shift | シフト |
| shift_requests | Shift | シフト希望 |
| reservations | Reservation | 予約 |
| notifications | Notification | 通知 |
| notification_preferences | Notification | 通知設定 |
| outbox_events | Common | Outboxイベント |

---

## customers

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | 顧客ID (UUID) |
| auth_user_id | TEXT | NOT NULL, UNIQUE | 認証基盤ユーザーID |
| display_name | TEXT | NOT NULL | 表示名 |
| email | TEXT | NOT NULL, UNIQUE | メールアドレス |
| phone_number | TEXT | | 電話番号 |
| status | TEXT | NOT NULL, DEFAULT 'active' | ステータス (active / suspended) |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_customers_auth_user_id` ON (auth_user_id)
- `idx_customers_email` ON (email)
- `idx_customers_status` ON (status)

---

## tenants

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | テナントID (UUID) |
| name | TEXT | NOT NULL | テナント名 |
| category | TEXT | NOT NULL | カテゴリー |
| url_path | TEXT | NOT NULL, UNIQUE | URLパス |
| postal_code | TEXT | NOT NULL | 郵便番号 |
| address_prefecture | TEXT | NOT NULL | 都道府県 |
| address_city | TEXT | NOT NULL | 市区町村 |
| address_street | TEXT | NOT NULL | 番地 |
| phone_number | TEXT | NOT NULL | 電話番号 |
| description | TEXT | | 店舗紹介文 |
| image_urls | TEXT | NOT NULL, DEFAULT '[]' | 画像URL (JSON配列) |
| business_hours | TEXT | NOT NULL | 営業時間 (JSON) |
| regular_holidays | TEXT | NOT NULL, DEFAULT '[]' | 定休日 (JSON配列) |
| reservation_booking_window_days | INTEGER | NOT NULL, DEFAULT 30 | 予約受付期間（日数） |
| reservation_booking_deadline_hours | INTEGER | NOT NULL, DEFAULT 2 | 予約受付締切（時間前） |
| reservation_cancellation_deadline_hours | INTEGER | NOT NULL, DEFAULT 24 | キャンセル期限（時間前） |
| reservation_slot_duration_minutes | INTEGER | NOT NULL, DEFAULT 30 | 予約枠時間単位（分） |
| reservation_buffer_minutes | INTEGER | NOT NULL, DEFAULT 0 | バッファ時間（分） |
| reservation_approval_method | TEXT | NOT NULL, DEFAULT 'auto' | 承認方法 (auto / manual) |
| status | TEXT | NOT NULL, DEFAULT 'active' | ステータス (active / suspended) |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_tenants_url_path` ON (url_path)
- `idx_tenants_status` ON (status)
- `idx_tenants_category` ON (category)

---

## temporary_holidays

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | ID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| date | TEXT | NOT NULL | 日付 (YYYY-MM-DD) |
| reason | TEXT | | 理由 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |

**インデックス:**
- `idx_temporary_holidays_tenant_date` ON (tenant_id, date) UNIQUE

---

## members

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | メンバーID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| auth_user_id | TEXT | NOT NULL | 認証基盤ユーザーID |
| name | TEXT | NOT NULL | 氏名 |
| email | TEXT | NOT NULL | メールアドレス |
| phone_number | TEXT | | 電話番号 |
| role | TEXT | NOT NULL | ロール (admin / staff) |
| joined_at | INTEGER | NOT NULL | 参加日時 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_members_tenant_id` ON (tenant_id)
- `idx_members_auth_user_id` ON (auth_user_id)
- `idx_members_tenant_auth` ON (tenant_id, auth_user_id) UNIQUE

---

## invitations

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | 招待ID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| email | TEXT | NOT NULL | 招待先メールアドレス |
| role | TEXT | NOT NULL | ロール (admin / staff) |
| invited_by | TEXT | NOT NULL, FK → members.id | 招待者メンバーID |
| status | TEXT | NOT NULL, DEFAULT 'pending' | ステータス (pending / accepted / declined / expired / cancelled) |
| expires_at | INTEGER | NOT NULL | 有効期限 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_invitations_tenant_id` ON (tenant_id)
- `idx_invitations_email_status` ON (email, status)

---

## menus

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | メニューID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| name | TEXT | NOT NULL | メニュー名 |
| category | TEXT | | カテゴリー |
| description | TEXT | | 説明文 |
| duration | INTEGER | NOT NULL | 所要時間（分） |
| price | INTEGER | NOT NULL | 料金 |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 表示順 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_menus_tenant_id` ON (tenant_id)
- `idx_menus_tenant_name` ON (tenant_id, name) UNIQUE

---

## staff_profiles

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | スタッフプロフィールID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| member_id | TEXT | NOT NULL, UNIQUE, FK → members.id | メンバーID |
| display_name | TEXT | NOT NULL | 表示名 |
| image_url | TEXT | | プロフィール画像URL |
| bio | TEXT | | 自己紹介文 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_staff_profiles_tenant_id` ON (tenant_id)
- `idx_staff_profiles_member_id` ON (member_id)

---

## staff_assigned_menus

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| staff_profile_id | TEXT | NOT NULL, FK → staff_profiles.id | スタッフプロフィールID |
| menu_id | TEXT | NOT NULL, FK → menus.id | メニューID |

**主キー:** (staff_profile_id, menu_id)

**インデックス:**
- `idx_staff_assigned_menus_menu_id` ON (menu_id)

---

## shifts

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | シフトID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| staff_profile_id | TEXT | NOT NULL, FK → staff_profiles.id | スタッフプロフィールID |
| date | TEXT | NOT NULL | シフト日付 (YYYY-MM-DD) |
| start_time | TEXT | NOT NULL | 開始時刻 (HH:MM) |
| end_time | TEXT | NOT NULL | 終了時刻 (HH:MM) |
| recurring_group_id | TEXT | | 繰り返しグループID |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_shifts_tenant_date` ON (tenant_id, date)
- `idx_shifts_staff_date` ON (staff_profile_id, date)
- `idx_shifts_recurring_group` ON (recurring_group_id)

---

## shift_requests

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | シフト希望ID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| staff_profile_id | TEXT | NOT NULL, FK → staff_profiles.id | スタッフプロフィールID |
| date | TEXT | NOT NULL | 対象日付 (YYYY-MM-DD) |
| type | TEXT | NOT NULL | 希望タイプ (work / off) |
| start_time | TEXT | | 希望開始時刻 |
| end_time | TEXT | | 希望終了時刻 |
| note | TEXT | | 備考 |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_shift_requests_staff_date` ON (staff_profile_id, date)
- `idx_shift_requests_tenant_date` ON (tenant_id, date)

---

## reservations

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | 予約ID (UUID) |
| tenant_id | TEXT | NOT NULL, FK → tenants.id | テナントID |
| customer_id | TEXT | FK → customers.id | 顧客ID |
| menu_id | TEXT | NOT NULL | メニューID（参照用、FK制約なし） |
| staff_profile_id | TEXT | | スタッフプロフィールID（参照用、FK制約なし） |
| date | TEXT | NOT NULL | 予約日 (YYYY-MM-DD) |
| start_time | TEXT | NOT NULL | 開始時刻 (HH:MM) |
| end_time | TEXT | NOT NULL | 終了時刻 (HH:MM) |
| status | TEXT | NOT NULL, DEFAULT 'pending' | ステータス (pending / confirmed / completed / cancelled / rejected) |
| menu_name | TEXT | NOT NULL | メニュー名（スナップショット） |
| menu_duration | INTEGER | NOT NULL | 所要時間（スナップショット） |
| menu_price | INTEGER | NOT NULL | 料金（スナップショット） |
| staff_name | TEXT | | スタッフ名（スナップショット） |
| customer_name | TEXT | | 顧客名 |
| customer_email | TEXT | | 顧客メールアドレス |
| customer_phone_number | TEXT | | 顧客電話番号 |
| note | TEXT | | 備考 |
| cancellation_reason | TEXT | | キャンセル理由 |
| rejection_reason | TEXT | | 却下理由 |
| created_by | TEXT | NOT NULL | 作成者種別 (customer / admin / staff) |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_reservations_tenant_date` ON (tenant_id, date)
- `idx_reservations_tenant_status` ON (tenant_id, status)
- `idx_reservations_customer_id` ON (customer_id)
- `idx_reservations_staff_date` ON (staff_profile_id, date)
- `idx_reservations_status_date` ON (status, date)

**備考:**
- menu_id, staff_profile_id にFK制約を設けないのは、メニュー/スタッフが削除されても予約データを保持するため
- メニュー名・料金・所要時間・スタッフ名はスナップショットとして保存（予約時点の情報を正確に記録）

---

## notifications

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | 通知ID (UUID) |
| recipient_type | TEXT | NOT NULL | 受信者種別 (customer / member) |
| recipient_id | TEXT | NOT NULL | 受信者ID |
| type | TEXT | NOT NULL | 通知タイプ |
| title | TEXT | NOT NULL | タイトル |
| message | TEXT | NOT NULL | メッセージ |
| reference_type | TEXT | | 参照エンティティ種別 |
| reference_id | TEXT | | 参照エンティティID |
| is_read | INTEGER | NOT NULL, DEFAULT 0 | 既読フラグ (0/1) |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |

**インデックス:**
- `idx_notifications_recipient` ON (recipient_type, recipient_id, created_at DESC)
- `idx_notifications_recipient_unread` ON (recipient_type, recipient_id, is_read)

---

## notification_preferences

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | 設定ID (UUID) |
| recipient_type | TEXT | NOT NULL | 受信者種別 |
| recipient_id | TEXT | NOT NULL | 受信者ID |
| channel | TEXT | NOT NULL | チャネル (email / in_app) |
| type | TEXT | NOT NULL | 通知タイプ |
| enabled | INTEGER | NOT NULL, DEFAULT 1 | 有効/無効 (0/1) |
| updated_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 更新日時 |

**インデックス:**
- `idx_notification_preferences_recipient` ON (recipient_type, recipient_id)
- `idx_notification_preferences_unique` ON (recipient_type, recipient_id, channel, type) UNIQUE

---

## outbox_events

| カラム名 | 型 | 制約 | 説明 |
|---|---|---|---|
| id | TEXT | PK | イベントID (UUID) |
| event_type | TEXT | NOT NULL | イベントタイプ |
| payload | TEXT | NOT NULL | ペイロード (JSON) |
| occurred_at | INTEGER | NOT NULL | 発生日時 |
| processed_at | INTEGER | | 処理日時（null = 未処理） |
| created_at | INTEGER | NOT NULL, DEFAULT unixepoch() | 作成日時 |

**インデックス:**
- `idx_outbox_events_unprocessed` ON (processed_at) WHERE processed_at IS NULL
