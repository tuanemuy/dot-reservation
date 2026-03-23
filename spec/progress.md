# 実装進捗

## ドメイン
- [x] common (共通型: Event, Pagination, 共有値オブジェクト)
- [x] customer
- [x] tenant
- [x] member
- [x] menu
- [x] staff
- [x] shift
- [x] reservation
- [x] notification
- [x] auth (AuthProvider ポート, AuthUser/AuthSession 型定義)

## アダプター
- [x] drizzleSqlite (スキーマ + リポジトリ)
- [x] betterAuth (AuthProvider 実装, better-auth 設定, Drizzle アダプター)
- [x] drizzleSqlite スキーマ更新 (better-auth テーブル: users, sessions, accounts, verifications)

## ユースケース
- [x] customer
- [x] tenant
- [x] member
- [x] menu
- [x] staff
- [x] shift
- [x] reservation
- [x] notification
- [x] auth (cleanupAuthUserIfOrphaned)
- [x] customer 更新 (deleteCustomer → cleanupAuthUserIfOrphaned)
- [x] member 更新 (deleteMemberAccount → cleanupAuthUserIfOrphaned)
- [x] Container 型更新 (authProvider 追加)

## テスト
- [x] customer (54 tests)
- [x] tenant (126 tests)
- [x] member (97 tests)
- [x] menu (45 tests)
- [x] staff (43 tests)
- [x] shift (63 tests)
- [x] reservation (104 tests)
- [x] notification (62 tests)
- [x] auth (cleanupAuthUserIfOrphaned: 6 tests, authIntegration: 4 tests)

## フロントエンド
- [x] 公開ページ（顧客向け）
- [x] 顧客認証ページ
- [x] 顧客マイページ
- [x] 管理画面認証ページ
- [x] 管理画面共通ページ
- [x] テナント管理者ページ
- [x] スタッフページ
- [x] プラットフォーム管理画面
- [x] better-auth クライアント設定 (authClient 初期化)
- [x] better-auth API ルート (app/routes/api.auth.$.ts)
- [x] 顧客プロフィール作成ページ (/customer/setup) — クロス登録用
- [x] 管理画面プロフィール作成ページ (/admin/setup) — クロス登録用
- [x] 顧客認証ページ更新 (signUp/signIn/signOut/forgetPassword/resetPassword 実装)
- [x] 管理画面認証ページ更新 (同上)
- [x] プラットフォーム認証ページ更新 (同上)
- [x] ルートローダー更新 (authProvider.getSession によるセッション検証)
- [x] 登録ページ更新 (メール登録済み時のログイン誘導)
- [x] プラットフォーム管理画面ユースケース接続 (dashboard/users/tenants)
- [x] 管理画面共通ページユースケース接続 (tenants/new-tenant/invitations/profile/notifications/members)

## 残存課題（低リスク・別タスク）
- [ ] platform/users: lastLoginAt がスタブ（null）— ログイン履歴取得のユースケースが未定義
- [ ] platform/tenants: memberCount がスタブ（0）— テナント一覧での集計が未実装
- [ ] platform/tenants/$tenantId: stats（メニュー数・予約数）がスタブ（0）
- [ ] admin/profile: changePassword が server-side 未実装（client-side authClient.changePassword() を推奨）
- [ ] admin/notifications: フィルター適用時の totalPages 計算がフィルタ前の totalCount ベース
- [ ] admin/invitations: inviterName が空文字（招待者の名前取得が未実装）
