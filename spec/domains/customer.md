# Customer ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| 顧客（Customer） | サービスを利用して予約を行うエンドユーザー |
| 顧客ID（CustomerId） | 顧客を一意に識別するID |
| 表示名（DisplayName） | 予約時等に表示される顧客の名前 |
| 顧客ステータス（CustomerStatus） | 顧客アカウントの状態（アクティブ / 停止中） |

## エンティティ

### Customer（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | CustomerId | 顧客ID |
| authUserId | string | 認証基盤でのユーザーID |
| displayName | CustomerDisplayName | 表示名 |
| email | Email | メールアドレス |
| phoneNumber | PhoneNumber \| null | 電話番号（任意） |
| status | CustomerStatus | アカウントステータス |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Customer.create(params)` — 顧客を作成する
- `Customer.updateProfile(customer, params)` — プロフィールを更新する
- `Customer.suspend(customer)` — アカウントを停止する
- `Customer.reactivate(customer)` — アカウントを再開する
- `Customer.isActive(customer)` — アクティブかを判定する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| CustomerId | string (branded) | UUID形式 |
| CustomerDisplayName | string (branded) | 1〜50文字 |
| Email | string (branded) | メールアドレス形式 |
| PhoneNumber | string (branded) | 電話番号形式 |
| CustomerStatus | "active" \| "suspended" | — |

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| customer.created | customerId | 顧客アカウント作成時 |
| customer.suspended | customerId | アカウント停止時 |
| customer.reactivated | customerId | アカウント再開時 |
| customer.deleted | customerId, email | アカウント削除時 |

## ポート

### CustomerRepository

- `save(customer: Customer): Promise<void>`
- `findById(id: CustomerId): Promise<Customer | null>`
- `findByAuthUserId(authUserId: string): Promise<Customer | null>`
- `findByEmail(email: Email): Promise<Customer | null>`
- `findAll(filter, pagination): Promise<PaginationResult<Customer>>`
- `delete(id: CustomerId): Promise<void>`

## ユースケース（概要）

- 顧客アカウントを作成する
- プロフィールを更新する
- 顧客情報を取得する
- 顧客アカウントを削除する
- 顧客アカウントを停止する（プラットフォーム管理者）
- 顧客アカウントを再開する（プラットフォーム管理者）
- 顧客一覧を取得する（プラットフォーム管理者）
