# Notification ドメイン

## 概要

Notificationドメインは、メール通知の管理と送信を担当します。予約確認メール、メールアドレス確認メール、予約変更通知メール、予約キャンセル通知メール、リマインドメール、パスワードリセットメール、スタッフアカウント招待メール、メール再送信機能を提供します。

## エンティティ

### EmailNotification

メール通知を表すエンティティ。送信履歴を記録します。

```typescript
export type EmailNotification = Readonly<{
  id: EmailNotificationId;
  type: NotificationType;
  recipientEmail: Email;
  subject: string;
  body: string;
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- すべてのメール送信を記録
- 送信成功時は `sentAt` に時刻を記録
- 送信失敗時は `failedAt` と `failureReason` を記録
- メタデータには関連エンティティのID（予約ID、顧客IDなど）を保存

### NotificationTemplate

メールテンプレートを表すエンティティ。

```typescript
export type NotificationTemplate = Readonly<{
  id: NotificationTemplateId;
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- テンプレートは通知タイプごとに1つ
- テンプレート変数を使用して動的なコンテンツを生成
- 変数はプレースホルダー形式（例: `{{customerName}}`, `{{reservationDate}}`）

## 値オブジェクト

### EmailNotificationId / NotificationTemplateId

```typescript
export type EmailNotificationId = string & { readonly brand: "EmailNotificationId" };
export type NotificationTemplateId = string & { readonly brand: "NotificationTemplateId" };

export function generateEmailNotificationId(): EmailNotificationId;
export function generateNotificationTemplateId(): NotificationTemplateId;
```

### NotificationType

```typescript
export type NotificationType =
  | "reservation-confirmation"
  | "reservation-update"
  | "reservation-cancellation"
  | "reservation-reminder"
  | "email-verification"
  | "password-reset"
  | "staff-invitation"
  | "account-deletion";

export function createNotificationType(type: string): NotificationType;
```

### NotificationVariables

各通知タイプで使用される変数。

```typescript
// 予約確認メール
export type ReservationConfirmationVariables = {
  customerName: string;
  menuName: string;
  staffName: string | null;
  reservationDate: string;
  reservationTime: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
};

// 予約変更メール
export type ReservationUpdateVariables = ReservationConfirmationVariables & {
  oldReservationDate: string;
  oldReservationTime: string;
};

// 予約キャンセルメール
export type ReservationCancellationVariables = {
  customerName: string;
  menuName: string;
  staffName: string | null;
  reservationDate: string;
  reservationTime: string;
  cancellationReason: string | null;
};

// リマインドメール
export type ReservationReminderVariables = ReservationConfirmationVariables;

// メールアドレス確認メール
export type EmailVerificationVariables = {
  customerName: string;
  verificationUrl: string;
};

// パスワードリセットメール
export type PasswordResetVariables = {
  customerName: string;
  resetUrl: string;
};

// スタッフ招待メール
export type StaffInvitationVariables = {
  staffEmail: string;
  role: string;
  invitationUrl: string;
};

// アカウント削除メール
export type AccountDeletionVariables = {
  customerName: string;
};
```

## エラーコード

```typescript
export enum NotificationErrorCode {
  // テンプレート
  TemplateNotFound = "TEMPLATE_NOT_FOUND",
  InvalidTemplate = "INVALID_TEMPLATE",
  MissingVariable = "MISSING_VARIABLE",

  // 送信
  EmailSendFailed = "EMAIL_SEND_FAILED",
  InvalidRecipient = "INVALID_RECIPIENT",

  // その他
  NotificationNotFound = "NOTIFICATION_NOT_FOUND",
}
```

## ポート

### EmailNotificationRepository

```typescript
export interface EmailNotificationRepository {
  save(notification: EmailNotification): Promise<void>;
  findById(id: EmailNotificationId): Promise<EmailNotification | null>;
  findByRecipient(email: Email): Promise<EmailNotification[]>;
  findByType(type: NotificationType): Promise<EmailNotification[]>;
  findPendingReminders(beforeTime: Date): Promise<EmailNotification[]>;
}
```

### NotificationTemplateRepository

```typescript
export interface NotificationTemplateRepository {
  save(template: NotificationTemplate): Promise<void>;
  findByType(type: NotificationType): Promise<NotificationTemplate | null>;
  findAll(): Promise<NotificationTemplate[]>;
}
```

### EmailSender

メール送信を行うポート。

```typescript
export interface EmailSender {
  send(to: Email, subject: string, body: string): Promise<void>;
}
```

### TemplateEngine

テンプレートエンジンを表すポート。

```typescript
export interface TemplateEngine {
  render(template: string, variables: Record<string, unknown>): string;
}
```

## ユースケース

### 1. sendReservationConfirmation

予約確認メールを送信する。

```typescript
export type SendReservationConfirmationInput = {
  reservationId: string;
};

export async function sendReservationConfirmation(
  context: Context,
  input: SendReservationConfirmationInput
): Promise<void>;
```

**処理フロー**:
1. 予約情報を取得
2. 顧客情報を取得
3. メニュー情報を取得
4. スタッフ情報を取得（指定がある場合）
5. クリニック情報を取得
6. テンプレートを取得
7. 変数を準備
8. テンプレートをレンダリング
9. EmailNotificationエンティティを作成
10. データベースに保存
11. メールを送信
12. 送信結果を記録

**エラー**:
- `NotFoundError`: 予約、顧客、テンプレートが見つからない
- `SystemError`: メール送信失敗

### 2. sendReservationUpdate

予約変更メールを送信する。

```typescript
export type SendReservationUpdateInput = {
  reservationId: string;
  oldReservationDate: Date;
  oldReservationTime: Date;
};

export async function sendReservationUpdate(
  context: Context,
  input: SendReservationUpdateInput
): Promise<void>;
```

**処理フロー**:
sendReservationConfirmationと同様ですが、変更前の情報も含めます。

### 3. sendReservationCancellation

予約キャンセルメールを送信する。

```typescript
export type SendReservationCancellationInput = {
  reservationId: string;
  cancellationReason?: string;
};

export async function sendReservationCancellation(
  context: Context,
  input: SendReservationCancellationInput
): Promise<void>;
```

**処理フロー**:
1. 予約情報を取得
2. 顧客情報を取得
3. メニュー情報を取得
4. スタッフ情報を取得（指定がある場合）
5. テンプレートを取得
6. 変数を準備（キャンセル理由を含む）
7. テンプレートをレンダリング
8. EmailNotificationエンティティを作成
9. データベースに保存
10. メールを送信
11. 送信結果を記録

### 4. sendReservationReminder

予約リマインドメールを送信する。

```typescript
export type SendReservationReminderInput = {
  reservationId: string;
};

export async function sendReservationReminder(
  context: Context,
  input: SendReservationReminderInput
): Promise<void>;
```

**処理フロー**:
sendReservationConfirmationと同様です。

### 5. sendEmailVerification

メールアドレス確認メールを送信する。

```typescript
export type SendEmailVerificationInput = {
  userId: string;
  verificationToken: string;
};

export async function sendEmailVerification(
  context: Context,
  input: SendEmailVerificationInput
): Promise<void>;
```

**処理フロー**:
1. ユーザー情報を取得
2. 顧客情報を取得
3. テンプレートを取得
4. 確認URLを生成
5. 変数を準備
6. テンプレートをレンダリング
7. EmailNotificationエンティティを作成
8. データベースに保存
9. メールを送信
10. 送信結果を記録

### 6. sendPasswordReset

パスワードリセットメールを送信する。

```typescript
export type SendPasswordResetInput = {
  userId: string;
  resetToken: string;
};

export async function sendPasswordReset(
  context: Context,
  input: SendPasswordResetInput
): Promise<void>;
```

**処理フロー**:
sendEmailVerificationと同様です。

### 7. sendStaffInvitation

スタッフ招待メールを送信する。

```typescript
export type SendStaffInvitationInput = {
  staffAccountId: string;
  invitationToken: string;
};

export async function sendStaffInvitation(
  context: Context,
  input: SendStaffInvitationInput
): Promise<void>;
```

**処理フロー**:
1. スタッフアカウント情報を取得
2. テンプレートを取得
3. 招待URLを生成
4. 変数を準備
5. テンプレートをレンダリング
6. EmailNotificationエンティティを作成
7. データベースに保存
8. メールを送信
9. 送信結果を記録

### 8. sendAccountDeletion

アカウント削除完了メールを送信する。

```typescript
export type SendAccountDeletionInput = {
  email: string;
  customerName: string;
};

export async function sendAccountDeletion(
  context: Context,
  input: SendAccountDeletionInput
): Promise<void>;
```

**処理フロー**:
1. テンプレートを取得
2. 変数を準備
3. テンプレートをレンダリング
4. EmailNotificationエンティティを作成
5. データベースに保存
6. メールを送信
7. 送信結果を記録

### 9. resendNotification

通知を再送信する。

```typescript
export type ResendNotificationInput = {
  notificationId: string;
};

export async function resendNotification(
  context: Context,
  input: ResendNotificationInput
): Promise<void>;
```

**処理フロー**:
1. 通知を検索
2. メールを再送信
3. 送信結果を記録

**エラー**:
- `NotFoundError`: 通知が見つからない
- `SystemError`: メール送信失敗

### 10. getNotificationHistory

通知履歴を取得する（スタッフのみ）。

```typescript
export type GetNotificationHistoryInput = {
  email?: string;
  type?: NotificationType;
  limit?: number;
  offset?: number;
};

export async function getNotificationHistory(
  context: Context,
  input: GetNotificationHistoryInput
): Promise<EmailNotification[]>;
```

**処理フロー**:
1. スタッフ権限チェック
2. フィルター条件で通知を検索
3. 通知履歴を返却

**エラー**:
- `ForbiddenError`: スタッフ権限なし

### 11. createOrUpdateTemplate

テンプレートを作成または更新する（管理者のみ）。

```typescript
export type CreateOrUpdateTemplateInput = {
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  variables: string[];
};

export async function createOrUpdateTemplate(
  context: Context,
  input: CreateOrUpdateTemplateInput
): Promise<NotificationTemplate>;
```

**処理フロー**:
1. 管理者権限チェック
2. 既存のテンプレートを検索
3. NotificationTemplateエンティティの作成または更新
4. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `BusinessRuleError`: バリデーションエラー

### 12. sendPendingReminders（バッチジョブ）

送信待ちのリマインドメールを送信する。

```typescript
export async function sendPendingReminders(context: Context): Promise<void>;
```

**処理フロー**:
1. 予約設定を取得
2. リマインド送信時刻を計算
3. 該当する予約を検索（ステータスがconfirmed、リマインド未送信）
4. 各予約に対してリマインドメールを送信
5. 送信済みフラグを記録

**実行タイミング**:
- 定期的にバッチジョブとして実行（例: 1時間ごと）

## 補足

### テンプレート変数の管理

テンプレート変数は、各通知タイプで必要な情報を定義します。テンプレートエンジンは、これらの変数をテンプレート文字列に埋め込んでメール本文を生成します。

例:
```
件名: {{clinicName}} - ご予約確認

{{customerName}} 様

この度は{{clinicName}}をご予約いただき、ありがとうございます。

ご予約内容:
- メニュー: {{menuName}}
- スタッフ: {{staffName}}
- 日時: {{reservationDate}} {{reservationTime}}

店舗情報:
- 住所: {{clinicAddress}}
- 電話: {{clinicPhone}}

ご来院をお待ちしております。
```

### メール送信の非同期処理

メール送信は時間がかかる可能性があるため、以下のアプローチが考えられます:

1. **同期送信**: ユースケース内で直接送信（シンプル、エラーハンドリングが容易）
2. **非同期送信**: キューに追加し、バックグラウンドで送信（パフォーマンス向上）

現在の設計では同期送信を前提としていますが、将来的に非同期送信に切り替えることも可能です。

### 送信失敗時のリトライ

メール送信に失敗した場合、自動的にリトライする機能を実装できます:
- リトライ回数の上限を設定
- 指数バックオフで再送信
- 最終的に失敗した場合は管理者に通知

### メール配信サービスの選択

ブラウザベースのアプリケーションでは、以下の方法でメール送信を実装できます:

1. **外部APIを使用**: SendGrid, AWS SES, Mailgun などのメール配信サービス
2. **サーバーサイド処理**: サーバーレス関数（Cloudflare Workers, Vercel Edge Functions など）を使用

現在のアーキテクチャでは、EmailSenderポートを実装することで、任意のメール配信サービスに対応できます。

### 拡張性

- SMS通知の追加
- プッシュ通知の追加
- 通知の購読設定（顧客が受け取る通知を選択可能）
- 多言語対応（テンプレートの多言語化）
- HTMLメールの対応
- 添付ファイルの対応
