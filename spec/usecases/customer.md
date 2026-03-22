# Customer ユースケース

## createCustomer — 顧客アカウントを作成する

### 概要

認証基盤でのユーザー登録完了後に、顧客エンティティを作成する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 認証基盤のユーザーID |
| displayName | string | ✓ | 表示名 |
| email | string | ✓ | メールアドレス |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 顧客ID |
| displayName | string | 表示名 |
| email | string | メールアドレス |

### テストケース

- 正常に顧客を作成できる
- 同じ authUserId で重複作成しようとするとエラー
- 表示名が空文字の場合バリデーションエラー

---

## updateCustomerProfile — プロフィールを更新する

### 概要

顧客が自身のプロフィール情報を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| customerId | string | ✓ | 顧客ID |
| displayName | string | ✓ | 表示名 |
| phoneNumber | string \| null | | 電話番号 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 顧客ID |
| displayName | string | 表示名 |
| phoneNumber | string \| null | 電話番号 |

### テストケース

- 正常にプロフィールを更新できる
- 存在しない顧客IDの場合 NotFoundError
- 表示名が空文字の場合バリデーションエラー

---

## getCustomer — 顧客情報を取得する

### 概要

顧客IDまたは認証ユーザーIDで顧客情報を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| customerId | string | | 顧客ID（いずれか必須） |
| authUserId | string | | 認証ユーザーID（いずれか必須） |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 顧客ID |
| displayName | string | 表示名 |
| email | string | メールアドレス |
| phoneNumber | string \| null | 電話番号 |
| status | string | ステータス |
| createdAt | Date | 作成日時 |

### テストケース

- 顧客IDで取得できる
- 認証ユーザーIDで取得できる
- 存在しない場合 NotFoundError

---

## deleteCustomer — 顧客アカウントを削除する

### 概要

顧客が自身のアカウントを削除する。未来の予約がある場合は削除不可。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| customerId | string | ✓ | 顧客ID |

### 出力DTO

なし

### テストケース

- 正常にアカウントを削除できる
- 未来の確定予約がある場合 ConflictError
- 存在しない顧客IDの場合 NotFoundError

---

## suspendCustomer — 顧客アカウントを停止する

### 概要

プラットフォーム管理者が顧客アカウントを停止する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| customerId | string | ✓ | 顧客ID |

### 出力DTO

なし

### テストケース

- 正常にアカウントを停止できる
- 既に停止中の場合 ConflictError
- 存在しない顧客IDの場合 NotFoundError

---

## reactivateCustomer — 顧客アカウントを再開する

### 概要

プラットフォーム管理者が停止中の顧客アカウントを再開する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| customerId | string | ✓ | 顧客ID |

### 出力DTO

なし

### テストケース

- 正常にアカウントを再開できる
- 既にアクティブの場合 ConflictError
- 存在しない顧客IDの場合 NotFoundError

---

## listCustomers — 顧客一覧を取得する

### 概要

プラットフォーム管理者が顧客一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| keyword | string \| null | | キーワード検索（名前、メール） |
| status | string \| null | | ステータスフィルター |
| page | number | ✓ | ページ番号 |
| limit | number | ✓ | 取得件数 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | CustomerSummary[] | 顧客一覧 |
| totalCount | number | 総件数 |

### テストケース

- 一覧を取得できる
- キーワードで絞り込みできる
- ステータスで絞り込みできる
- ページネーションが正しく動作する
