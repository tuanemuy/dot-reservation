# ドメイン一覧

## ドメイン

| ドメイン | 責務 | 詳細 |
|---|---|---|
| Auth | 認証・セッション管理（better-auth による横断的関心事） | [auth.md](./auth.md) |
| Customer | 顧客のアカウント・プロフィール管理 | [customer.md](./customer.md) |
| Tenant | テナント（店舗）の基本情報・営業設定・予約設定の管理 | [tenant.md](./tenant.md) |
| Member | テナントメンバーのアカウント・メンバーシップ・招待管理 | [member.md](./member.md) |
| Menu | テナントが提供するメニューの管理 | [menu.md](./menu.md) |
| Staff | スタッフの公開プロフィール・担当メニュー管理 | [staff.md](./staff.md) |
| Shift | スタッフのシフト・シフト希望の管理 | [shift.md](./shift.md) |
| Reservation | 予約のライフサイクル管理 | [reservation.md](./reservation.md) |
| Notification | 通知の配信・通知設定の管理 | [notification.md](./notification.md) |

## ドメイン間の関係

- **Customer** は **Reservation** から顧客IDで参照される
- **Tenant** は他の全ドメインの親エンティティ（テナントIDでスコープ）
- **Member** は **Tenant** に所属し、**Staff** と1対1で紐づく（スタッフロールの場合）
- **Menu** は **Tenant** に属し、**Staff** の担当メニューとして参照される
- **Staff** は **Member** と1対1で紐づき、**Shift** と **Reservation** から参照される
- **Shift** は **Staff** に属し、**Reservation** の空き判定に使用される
- **Reservation** は **Customer**, **Tenant**, **Menu**, **Staff** を参照する
- **Notification** は各ドメインのイベントを受けて生成される

## 認証について

認証（ログイン、セッション管理、パスワードハッシュ等）は better-auth が担当する（詳細は [auth.md](./auth.md)）。
各ドメインは better-auth から取得した `authUserId` を受け取ってビジネスロジックを実行する。
アプリケーション層は `AuthProvider` ポートを通じてセッション検証やユーザー管理を行う。

## ADR（Architecture Decision Records）

| ADR | タイトル |
|---|---|
| [ADR-001](../adr/001-better-auth-as-auth-adapter.md) | better-auth を認証アダプターとして採用 |
| [ADR-002](../adr/002-separate-customer-member-auth.md) | 顧客とメンバーの認証アカウント分離 |
