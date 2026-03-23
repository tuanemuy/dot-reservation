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
- [x] スタッフルート認証修正 (items[0] → 認証メンバーのスタッフプロフィール取得)
- [x] 顧客マイページ認証修正 (x-customer-id ヘッダー → authProvider.getSession)
- [x] プラットフォーム管理画面スタブ解消 (memberCount, stats, createdAt を実データに)
- [x] 管理画面通知フィルター修正 (サーバーサイドフィルタリング + 正しいページネーション)
- [x] 管理画面招待者名修正 (inviterName をメンバーリポジトリから取得)
- [x] パスワード変更をクライアントサイド実装 (authClient.changePassword())
- [x] 予約ページ認証修正 (shop.$urlPath.reserve.tsx の authProvider 統合)

- [x] 管理画面通知マルチテナント集約 (全テナントメンバーシップの通知を横断表示)
- [x] 予約一覧 menuName 重複表示修正
- [x] typeFilters テスト追加 (617 tests)
- [x] スタッフプロフィール未接続 file input 削除

## 残存課題（低リスク・別タスク）
- [ ] platform/users: lastLoginAt がスタブ（null）— AuthProvider ポートにセッション一覧メソッドが未定義のため取得不可
- [ ] deleteAccount ハンドラーのパスワード検証未実装 — AuthProvider ポート拡張が必要
