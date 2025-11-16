# ユースケース一覧

このドキュメントは、`spec/scenario.md` と `spec/requirements.md` に基づいて、バックエンドのアプリケーションサービス（`app/core/application/${domain}/${usecase}.ts`）で実装すべきユースケースを定義します。

## 1. 認証ドメイン (auth)

### 1.1 顧客向け認証

- **registerWithEmail** - Email/パスワードで顧客を新規登録する
- **registerWithSSO** - SSOプロバイダーで顧客を新規登録する
- **loginWithEmail** - Email/パスワードでログインする
- **loginWithSSO** - SSOプロバイダーでログインする
- **logout** - ログアウトする
- **sendEmailVerification** - メールアドレス確認メールを送信する
- **verifyEmail** - メールアドレス確認リンクから確認を完了する
- **requestPasswordReset** - パスワードリセット用リンクを送信する
- **resetPassword** - パスワードリセットリンクから新しいパスワードを設定する
- **validateSession** - セッションの有効性を検証する

### 1.2 スタッフ向け認証

- **createStaffAccount** - 管理者がスタッフアカウントを作成する
- **sendStaffInvitation** - 初回ログイン用リンクをスタッフに送信する
- **setupStaffPassword** - スタッフが初回ログイン時にパスワードを設定する
- **loginStaff** - スタッフがログインする
- **logoutStaff** - スタッフがログアウトする

## 2. 顧客ドメイン (customer)

### 2.1 顧客情報管理（顧客側）

- **createCustomerProfile** - 会員登録時に顧客プロフィールを作成する
- **getCustomerProfile** - 顧客プロフィールを取得する
- **updateCustomerProfile** - 顧客プロフィールを更新する（名前、電話番号、スポーツ情報など）
- **requestEmailChange** - 新しいメールアドレスへの変更リクエストを送信する
- **confirmEmailChange** - 確認リンクからメールアドレス変更を完了する
- **deleteCustomerAccount** - 顧客アカウントを削除する（有効な予約がない場合のみ）

### 2.2 顧客情報管理（店舗側）

- **listCustomers** - 顧客一覧を取得する
- **searchCustomers** - 顧客を検索する（名前、Email、電話番号）
- **getCustomerDetail** - 顧客の詳細情報を取得する（基本情報、予約履歴、来院履歴、No-show履歴）
- **createCustomerByStaff** - スタッフが顧客を直接作成する
- **updateCustomerByStaff** - スタッフが顧客情報を編集する
- **recordInitialInterview** - 初回来院時に問診情報と追加個人情報を記録する

## 3. 予約ドメイン (booking)

### 3.1 予約作成・管理（顧客側）

- **getAvailableSlots** - 指定したメニュー・スタッフの空き枠を取得する
- **createBooking** - 予約を作成する
- **getCustomerBookings** - 顧客の予約一覧を取得する（有効、過去、キャンセル済み）
- **getBookingDetail** - 予約の詳細情報を取得する
- **updateBooking** - 予約を変更する（日時、スタッフ変更）
- **cancelBooking** - 予約をキャンセルする
- **checkCancellationDeadline** - キャンセル期限をチェックする
- **checkUpdateDeadline** - 変更期限をチェックする

### 3.2 予約管理（店舗側）

- **getBookingCalendar** - カレンダー形式で予約状況を取得する
- **getBookingsByDate** - 指定日の予約一覧を取得する
- **createBookingByStaff** - スタッフが直接予約を作成する
- **updateBookingByStaff** - スタッフが予約を編集する
- **cancelBookingByStaff** - スタッフが予約をキャンセルする
- **confirmArrival** - 来院確認を記録する
- **recordNoShow** - No-showを記録する

## 4. 通知ドメイン (notification)

- **sendBookingConfirmation** - 予約確認メールを送信する
- **sendBookingUpdate** - 予約変更通知メールを送信する
- **sendBookingCancellation** - 予約キャンセル通知メールを送信する
- **sendBookingReminder** - 予約リマインドメールを送信する
- **sendEmailVerificationMail** - メールアドレス確認メールを送信する
- **sendPasswordResetMail** - パスワードリセットメールを送信する
- **sendStaffInvitationMail** - スタッフ招待メールを送信する
- **sendAccountDeletionConfirmation** - アカウント削除完了メールを送信する
- **resendBookingConfirmation** - 予約確認メールを再送信する

## 5. 店舗ドメイン (store)

### 5.1 店舗情報管理

- **createStoreInfo** - 店舗情報を作成する（初期セットアップ）
- **getStoreInfo** - 店舗情報を取得する
- **updateStoreInfo** - 店舗情報を更新する

### 5.2 営業時間管理

- **setBusinessHours** - 曜日ごとの営業時間を設定する
- **getBusinessHours** - 営業時間を取得する
- **setTemporaryClosure** - 臨時休業を設定する（既存予約がない場合のみ）
- **removeTemporaryClosure** - 臨時休業を解除する
- **checkExistingBookingsForClosure** - 休業設定時に既存予約の有無をチェックする

## 6. メニュードメイン (menu)

- **createMenu** - メニューを作成する
- **listMenus** - メニュー一覧を取得する
- **getMenuDetail** - メニューの詳細情報を取得する
- **updateMenu** - メニューを更新する
- **deleteMenu** - メニューを削除する（既存予約がない場合のみ）
- **checkExistingBookingsForMenu** - メニュー削除時に既存予約の有無をチェックする

## 7. スタッフドメイン (staff)

### 7.1 スタッフ情報管理

- **createStaff** - スタッフ情報を作成する
- **listStaff** - スタッフ一覧を取得する
- **getStaffDetail** - スタッフの詳細情報を取得する
- **updateStaff** - スタッフ情報を更新する
- **deleteStaff** - スタッフを削除する（既存予約がない場合のみ）
- **checkExistingBookingsForStaff** - スタッフ削除時に既存予約の有無をチェックする

### 7.2 シフト管理

- **setStaffShift** - スタッフのシフトを設定する
- **getStaffShift** - 指定日のスタッフシフトを取得する
- **getStaffAvailability** - スタッフの勤務可能時間を取得する（営業時間とシフトを考慮）

## 8. 設定ドメイン (settings)

- **setBookingSettings** - 予約の基本設定を保存する
  - 予約枠の時間間隔
  - 1枠あたりの最大予約数
  - 予約受付期限
  - キャンセル受付期限
  - 変更受付期限
  - リマインドメール送信タイミング
- **getBookingSettings** - 予約の基本設定を取得する
- **updateBookingSettings** - 予約の基本設定を更新する

## 9. バッチ処理・定期実行

以下は定期的に実行されるバッチ処理として実装されるユースケースです。

- **sendScheduledReminders** - 設定されたタイミングでリマインドメールを一括送信する
- **cleanupExpiredSessions** - 期限切れのセッションをクリーンアップする
- **cleanupExpiredPasswordResetTokens** - 期限切れのパスワードリセットトークンをクリーンアップする
- **cleanupExpiredEmailVerificationTokens** - 期限切れのメール確認トークンをクリーンアップする

## ユースケース間の依存関係

### 予約作成フロー（顧客側）

1. `getMenuDetail` - メニュー情報を取得
2. `getStaffDetail` - スタッフ情報を取得（任意）
3. `getStaffAvailability` - スタッフの勤務可能時間を取得
4. `getAvailableSlots` - 空き枠を取得
5. `createBooking` - 予約を作成
6. `sendBookingConfirmation` - 確認メールを送信

### 予約変更フロー（顧客側）

1. `getBookingDetail` - 予約詳細を取得
2. `checkUpdateDeadline` - 変更期限をチェック
3. `getAvailableSlots` - 新しい空き枠を取得
4. `updateBooking` - 予約を変更
5. `sendBookingUpdate` - 変更通知メールを送信

### 予約キャンセルフロー（顧客側）

1. `getBookingDetail` - 予約詳細を取得
2. `checkCancellationDeadline` - キャンセル期限をチェック
3. `cancelBooking` - 予約をキャンセル
4. `sendBookingCancellation` - キャンセル通知メールを送信

### 初回会員登録フロー（Email/パスワード）

1. `registerWithEmail` - アカウントを作成
2. `createCustomerProfile` - 顧客プロフィールを作成
3. `sendEmailVerification` - メールアドレス確認メールを送信
4. （ユーザー操作）メール内のリンクをクリック
5. `verifyEmail` - メールアドレスを確認

### 初回来院時の問診入力フロー（店舗側）

1. `searchCustomers` - 顧客を検索
2. `getCustomerDetail` - 顧客詳細を取得
3. `recordInitialInterview` - 問診情報と追加個人情報を記録

### メニュー削除フロー（店舗側）

1. `checkExistingBookingsForMenu` - 既存予約の有無をチェック
2. `deleteMenu` - メニューを削除（既存予約がない場合のみ）

### スタッフ削除フロー（店舗側）

1. `checkExistingBookingsForStaff` - 既存予約の有無をチェック
2. `deleteStaff` - スタッフを削除（既存予約がない場合のみ）

## 実装時の注意事項

1. **トランザクション管理**: 予約の作成・変更時は、在庫チェックと予約確定を同一トランザクション内で行い、重複予約を防止する

2. **エラーハンドリング**:
   - ドメイン層で `BusinessRuleError` をthrowする
   - アプリケーション層で `NotFoundError`、`ConflictError`、`ValidationError`、`SystemError` などをthrowする

3. **権限チェック**:
   - 顧客は自分の情報・予約のみ操作可能
   - スタッフは全ての情報を閲覧可能
   - 管理者は全ての操作が可能

4. **期限チェック**:
   - 予約変更・キャンセル時は必ず期限をチェックする
   - 期限を過ぎている場合は適切なエラーを返す

5. **メール送信**:
   - メール送信は非同期で行うことを検討
   - 送信失敗時のリトライ機構を実装
