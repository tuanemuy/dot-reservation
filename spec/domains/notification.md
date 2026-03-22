# Notification ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| 通知（Notification） | ユーザーに配信されるメッセージ |
| 通知設定（NotificationPreference） | ユーザーごとの通知受信設定 |
| 通知チャネル（NotificationChannel） | 通知の配信手段（メール / アプリ内） |
| 通知タイプ（NotificationType） | 通知の種類 |

## エンティティ

### Notification（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | NotificationId | 通知ID |
| recipientType | RecipientType | 受信者種別（customer / member） |
| recipientId | string | 受信者ID（CustomerIdまたはMemberId） |
| type | NotificationType | 通知タイプ |
| title | string | 通知タイトル |
| message | string | 通知メッセージ |
| referenceType | string \| null | 参照エンティティ種別（reservation等） |
| referenceId | string \| null | 参照エンティティID |
| isRead | boolean | 既読フラグ |
| createdAt | Date | 作成日時 |

### 振る舞い

- `Notification.create(params)` — 通知を作成する
- `Notification.markAsRead(notification)` — 既読にする

### NotificationPreference（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | NotificationPreferenceId | 設定ID |
| recipientType | RecipientType | 受信者種別 |
| recipientId | string | 受信者ID |
| channel | NotificationChannel | チャネル |
| type | NotificationType | 通知タイプ |
| enabled | boolean | 有効/無効 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `NotificationPreference.update(preference, enabled)` — 設定を更新する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| NotificationId | string (branded) | UUID形式 |
| NotificationPreferenceId | string (branded) | UUID形式 |
| RecipientType | "customer" \| "member" | — |
| NotificationChannel | "email" \| "in_app" | — |
| NotificationType | (下記参照) | — |

### NotificationType の定義

**顧客向け:**
- `reservation_confirmed` — 予約確定
- `reservation_updated` — 予約変更（店舗側）
- `reservation_cancelled` — 予約キャンセル（店舗側）
- `reservation_reminder` — 予約リマインダー
- `reservation_pending` — 予約承認待ち
- `reservation_approved` — 予約承認
- `reservation_rejected` — 予約却下

**テナントメンバー向け:**
- `new_reservation` — 新規予約
- `reservation_updated_by_customer` — 予約変更（顧客側）
- `reservation_cancelled_by_customer` — 予約キャンセル（顧客側）
- `invitation_received` — 招待受領
- `member_joined` — メンバー参加
- `member_left` — メンバー脱退
- `shift_request_submitted` — シフト希望提出

## ポート

### NotificationRepository

- `save(notification: Notification): Promise<void>`
- `findById(id: NotificationId): Promise<Notification | null>`
- `findByRecipient(recipientType: RecipientType, recipientId: string, filter, pagination): Promise<PaginationResult<Notification>>`
- `countUnreadByRecipient(recipientType: RecipientType, recipientId: string): Promise<number>`
- `markAllAsRead(recipientType: RecipientType, recipientId: string): Promise<void>`

### NotificationPreferenceRepository

- `save(preference: NotificationPreference): Promise<void>`
- `findByRecipient(recipientType: RecipientType, recipientId: string): Promise<NotificationPreference[]>`
- `findByRecipientAndChannelAndType(recipientType, recipientId, channel, type): Promise<NotificationPreference | null>`

### EmailSender

- `sendNotificationEmail(email: string, notification: Notification): Promise<void>`

## ユースケース（概要）

- 通知を作成する（ドメインイベントのハンドラーとして）
- 通知一覧を取得する
- 通知を既読にする
- すべての通知を既読にする
- 未読通知件数を取得する
- 通知設定を取得する
- 通知設定を更新する
