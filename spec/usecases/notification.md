# Notification ユースケース

## createNotification — 通知を作成する

### 概要

ドメインイベントのハンドラーとして通知を作成し、設定に応じてメール送信も行う。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別（customer / member） |
| recipientId | string | ✓ | 受信者ID |
| type | string | ✓ | 通知タイプ |
| title | string | ✓ | 通知タイトル |
| message | string | ✓ | 通知メッセージ |
| referenceType | string \| null | | 参照エンティティ種別 |
| referenceId | string \| null | | 参照エンティティID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 通知ID |

### テストケース

- 正常に通知を作成できる
- アプリ内通知がONの場合、アプリ内通知が作成される
- メール通知がONの場合、メールが送信される
- アプリ内通知がOFFかつメール通知もOFFの場合、何も作成されない
- 重要な通知（予約確定等）はアプリ内通知OFFでも作成される

---

## listNotifications — 通知一覧を取得する

### 概要

受信者の通知一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別 |
| recipientId | string | ✓ | 受信者ID |
| typeFilter | string \| null | | 通知タイプフィルター |
| page | number | ✓ | ページ番号 |
| limit | number | ✓ | 取得件数 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | NotificationDetail[] | 通知一覧 |
| totalCount | number | 総件数 |

### テストケース

- 通知一覧を取得できる
- 通知タイプでフィルタリングできる
- ページネーションが正しく動作する

---

## markNotificationAsRead — 通知を既読にする

### 概要

個別の通知を既読にする。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| notificationId | string | ✓ | 通知ID |

### 出力DTO

なし

### テストケース

- 正常に通知を既読にできる
- 既に既読の場合も正常終了

---

## markAllNotificationsAsRead — すべての通知を既読にする

### 概要

受信者のすべての未読通知を既読にする。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別 |
| recipientId | string | ✓ | 受信者ID |

### 出力DTO

なし

### テストケース

- すべての未読通知を既読にできる

---

## getUnreadNotificationCount — 未読通知件数を取得する

### 概要

受信者の未読通知件数を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別 |
| recipientId | string | ✓ | 受信者ID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| count | number | 未読件数 |

### テストケース

- 未読件数を取得できる
- 未読がない場合は0

---

## getNotificationPreferences — 通知設定を取得する

### 概要

受信者の通知設定一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別 |
| recipientId | string | ✓ | 受信者ID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| preferences | { channel: string, type: string, enabled: boolean }[] | 設定一覧 |

### テストケース

- 通知設定一覧を取得できる
- 未設定の場合はデフォルト値が返される

---

## updateNotificationPreference — 通知設定を更新する

### 概要

受信者の個別の通知設定を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| recipientType | string | ✓ | 受信者種別 |
| recipientId | string | ✓ | 受信者ID |
| channel | string | ✓ | チャネル（email / in_app） |
| type | string | ✓ | 通知タイプ |
| enabled | boolean | ✓ | 有効/無効 |

### 出力DTO

なし

### テストケース

- 正常に通知設定を更新できる
- 重要な通知のアプリ内通知はOFFにできない（ConflictError）
- メール通知はすべてOFFにできる
