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
- [x] nodemailer (AuthEmailSender, MemberEmailSender, NotificationEmailSender)
- [x] s3 (StorageManager — 画像アップロード・削除)

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
- [x] Container 型更新 (storageManager, outboxRepository 追加)
- [x] Event Relay Worker (Outbox イベント処理ワーカー)
- [x] removeMember / deleteMemberAccount — 担当予約の「担当者未定」処理
- [x] createProxyReservation — スタッフ権限チェック + 過去日付バリデーション
- [x] changeMemberRole — ConflictError への変換

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
- [x] 追加テスト: removeMember 予約解除 + changeMemberRole ConflictError + createProxyReservation 権限・過去日付 (623 tests)

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
- [x] 顧客プロフィール作成ページ (/customer/setup)
- [x] 管理画面プロフィール作成ページ (/admin/setup)
- [x] 顧客認証ページ更新 (signUp/signIn/signOut/forgetPassword/resetPassword)
- [x] 管理画面認証ページ更新 (同上)
- [x] プラットフォーム認証ページ更新 (同上)
- [x] ルートローダー更新 (authProvider.getSession によるセッション検証)
- [x] 登録ページ更新 (メール登録済み時のログイン誘導)
- [x] プラットフォーム管理画面ユースケース接続 (dashboard/users/tenants)
- [x] 管理画面共通ページユースケース接続 (tenants/new-tenant/invitations/profile/notifications/members)
- [x] スタッフルート認証修正
- [x] 顧客マイページ認証修正
- [x] プラットフォーム管理画面スタブ解消
- [x] 管理画面通知フィルター修正
- [x] 管理画面招待者名修正
- [x] パスワード変更をクライアントサイド実装
- [x] 予約ページ認証修正
- [x] 管理画面通知マルチテナント集約
- [x] 予約一覧 menuName 重複表示修正
- [x] スタッフプロフィール未接続 file input 削除
- [x] Layout (認証状態リンク切り替え、ユーザー情報表示、ログアウトボタン)
- [x] CSSトークン修正 (oklch, Inter font, Secondary/Accent, radius)
- [x] レイアウトコンポーネント修正 (ロゴ、サイドバー幅、ナビアイコン、active state)
- [x] 管理画面カラートークン置換 (17ファイル)

## 未実装
### バックエンド対応が必要
- [ ] platform/users: lastLoginAt の取得 — AuthProvider ポートにセッション一覧メソッドの追加が必要
- [ ] deleteAccount 時のパスワード検証 — AuthProvider ポートにパスワード検証メソッドの追加が必要（顧客プロフィール・管理画面プロフィール両方）
- [ ] 予約一覧の店舗名表示 — listReservations の ReservationSummary に tenantName を追加が必要（顧客マイページ予約一覧）
- [ ] 検索ページのエリアフィルター — ドメインにエリア概念がなく searchTenants にエリア絞り込み未対応
- [ ] スタッフ予約詳細で loaderData からメールアドレスを除外 — getReservation の返却値を制限する仕組みが必要

### フロントエンド未実装機能
- [ ] 予約管理カレンダー表示（管理者） — 週表示カレンダー（時間帯×日付、ステータス色分け）がプレースホルダーのまま
- [ ] 予約管理カレンダー表示（スタッフ） — 同上
- [ ] 管理者ダッシュボード初期セットアップガイド — テナント新規登録直後のみ表示するガイド
- [ ] 管理者ダッシュボード未対応招待バナー — 未対応招待の通知バナー
- [ ] テナント設定の画像アップロード — 画像のアップロード・並び替え・削除（最大10枚）がプレースホルダーのまま
- [ ] メニュー管理のドラッグ&ドロップ並び替え — メニューの並び順変更
- [ ] 予約変更ページの変更前後差分表示（管理者） — 変更前後の差分表示が未実装
- [ ] 予約変更ページの変更前後差分表示（スタッフ） — 同上
- [ ] URLパスのリアルタイム使用可否チェック — テナント新規登録・テナント設定で入力時の重複チェック
- [ ] テナント設定の住所フィールド個別化 — 現在は単一テキストフィールド、仕様は郵便番号・都道府県・市区町村・番地の個別フィールド
- [ ] メンバー管理のメンバー削除UI — removeMember handler は定義済みだが呼び出すUIがない
- [ ] テナント新規登録のステップバリデーション — 「次へ」クリック時にステップ1, 2のバリデーション未実行
- [ ] 通知設定の楽観的UI更新 — トグル操作時にローカル状態を即座に更新する楽観的UI（顧客・管理画面両方）
- [ ] トップページの動的データ取得 — エリア・カテゴリ選択肢がハードコード、loader での動的取得が必要

### コード品質
- [ ] AlertError コンポーネントの共通化 — 10箇所以上で重複定義、app/components/ui/AlertError.tsx に抽出すべき
- [ ] StatusBadge コンポーネントの共通化 — 10ファイル以上で重複定義、app/components/ui/ に抽出すべき
- [ ] スタイリング方針の統一 — プラットフォーム系（インラインstyle）、管理画面系（Tailwind+var()）、スタッフ系（独自テーマクラス）が混在
- [ ] AdminLayout のデザインシステム整合 — StaffLayout/PlatformLayout と比較してロゴ・アバター・フッター・アイコン等が欠如
- [ ] フォームハンドリングパターンの統一 — 顧客ページ（useState+手動Zod）と管理画面（Conform useForm）で不統一
