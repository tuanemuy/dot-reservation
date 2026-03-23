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
- [ ] better-auth クライアント設定 (authClient 初期化)
- [ ] better-auth API ルート (app/routes/api.auth.$.ts)
- [ ] 顧客プロフィール作成ページ (/customer/setup) — クロス登録用
- [ ] 管理画面プロフィール作成ページ (/admin/setup) — クロス登録用
- [ ] 顧客認証ページ更新 (signUp/signIn/signOut/forgetPassword/resetPassword 実装)
- [ ] 管理画面認証ページ更新 (同上)
- [ ] プラットフォーム認証ページ更新 (同上)
- [ ] ルートローダー更新 (authProvider.getSession によるセッション検証)
- [ ] 登録ページ更新 (メール登録済み時のログイン誘導)
