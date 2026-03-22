# Tenant ユースケース

## createTenant — テナントを作成する

### 概要

テナントメンバーが新しいテナント（店舗）を作成する。作成者は自動的に管理者ロールのメンバーになる。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 作成者の認証ユーザーID |
| name | string | ✓ | テナント名 |
| category | string | ✓ | カテゴリー |
| urlPath | string | ✓ | URLパス |
| postalCode | string | ✓ | 郵便番号 |
| address | { prefecture, city, street } | ✓ | 住所 |
| phoneNumber | string | ✓ | 電話番号 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | テナントID |
| name | string | テナント名 |
| urlPath | string | URLパス |

### テストケース

- 正常にテナントを作成できる
- 作成者が管理者メンバーとして自動登録される
- URLパスが既に使用されている場合 ConflictError
- デフォルトの営業設定・予約設定が初期値で作成される

---

## updateTenantProfile — テナント情報を更新する

### 概要

管理者がテナントの基本情報を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| name | string | ✓ | テナント名 |
| category | string | ✓ | カテゴリー |
| urlPath | string | ✓ | URLパス |
| postalCode | string | ✓ | 郵便番号 |
| address | { prefecture, city, street } | ✓ | 住所 |
| phoneNumber | string | ✓ | 電話番号 |
| description | string \| null | | 店舗紹介文 |
| imageUrls | string[] | ✓ | 店舗画像URL |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | テナントID |
| name | string | テナント名 |
| urlPath | string | URLパス |

### テストケース

- 正常にテナント情報を更新できる
- URLパスを変更でき、旧パスは使用可能になる
- 変更後のURLパスが他で使用されている場合 ConflictError
- 画像が10枚を超える場合バリデーションエラー

---

## updateBusinessHours — 営業時間を更新する

### 概要

管理者が曜日ごとの営業時間を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| businessHours | Record<number, { open: string, close: string } \| null> | ✓ | 曜日ごとの営業時間 |

### 出力DTO

なし

### テストケース

- 正常に営業時間を更新できる
- open >= close の場合バリデーションエラー

---

## updateRegularHolidays — 定休日を更新する

### 概要

管理者が定休日を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| dayOfWeeks | number[] | ✓ | 定休日の曜日 |

### 出力DTO

なし

### テストケース

- 正常に定休日を更新できる
- 無効な曜日値の場合バリデーションエラー

---

## addTemporaryHoliday — 臨時休業日を追加する

### 概要

管理者が臨時休業日を追加する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| date | string | ✓ | 日付 |
| reason | string \| null | | 理由 |

### 出力DTO

なし

### テストケース

- 正常に臨時休業日を追加できる
- 過去の日付の場合バリデーションエラー
- 同じ日付が既に登録されている場合 ConflictError

---

## removeTemporaryHoliday — 臨時休業日を削除する

### 概要

管理者が臨時休業日を削除する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| date | string | ✓ | 日付 |

### 出力DTO

なし

### テストケース

- 正常に臨時休業日を削除できる
- 登録されていない日付の場合 NotFoundError

---

## updateReservationSettings — 予約設定を更新する

### 概要

管理者が予約に関する設定を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| bookingWindowDays | number | ✓ | 予約受付期間（日数） |
| bookingDeadlineHours | number | ✓ | 予約受付締切（時間前） |
| cancellationDeadlineHours | number | ✓ | キャンセル期限（時間前） |
| slotDurationMinutes | number | ✓ | 予約枠の時間単位 |
| bufferMinutes | number | ✓ | バッファ時間 |
| approvalMethod | string | ✓ | 承認方法（auto / manual） |

### 出力DTO

なし

### テストケース

- 正常に予約設定を更新できる
- 無効な値の場合バリデーションエラー

---

## deleteTenant — テナントを削除する

### 概要

管理者がテナントを削除する。全データが削除される。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

なし

### テストケース

- 正常にテナントを削除できる
- 未来の予約がある場合でも削除可能（予約者に通知が送信される）
- 存在しないテナントIDの場合 NotFoundError

---

## getTenant — テナント情報を取得する

### 概要

テナントIDまたはURLパスでテナント情報を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | | テナントID（いずれか必須） |
| urlPath | string | | URLパス（いずれか必須） |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | テナントID |
| name | string | テナント名 |
| category | string | カテゴリー |
| urlPath | string | URLパス |
| postalCode | string | 郵便番号 |
| address | object | 住所 |
| phoneNumber | string | 電話番号 |
| description | string \| null | 紹介文 |
| imageUrls | string[] | 画像URL |
| businessHours | object | 営業時間 |
| regularHolidays | number[] | 定休日 |
| temporaryHolidays | object[] | 臨時休業日 |
| reservationSettings | object | 予約設定 |
| status | string | ステータス |

### テストケース

- テナントIDで取得できる
- URLパスで取得できる
- 存在しない場合 NotFoundError
- 停止中テナントを顧客がURLパスで取得した場合、停止中であることが分かる

---

## searchTenants — 店舗を検索する

### 概要

顧客が店舗を検索する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| keyword | string \| null | | キーワード |
| area | string \| null | | エリア |
| category | string \| null | | カテゴリー |
| page | number | ✓ | ページ番号 |
| limit | number | ✓ | 取得件数 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | TenantSummary[] | 店舗一覧 |
| totalCount | number | 総件数 |

### テストケース

- キーワードで検索できる
- エリアで絞り込みできる
- カテゴリーで絞り込みできる
- 停止中のテナントは結果に含まれない
- ページネーションが正しく動作する

---

## suspendTenant — テナントを停止する

### 概要

プラットフォーム管理者がテナントを停止する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

なし

### テストケース

- 正常にテナントを停止できる
- 既に停止中の場合 ConflictError
- テナント管理者に停止通知が送信される

---

## reactivateTenant — テナントを再開する

### 概要

プラットフォーム管理者が停止中のテナントを再開する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

なし

### テストケース

- 正常にテナントを再開できる
- 既に稼働中の場合 ConflictError

---

## listTenants — テナント一覧を取得する

### 概要

プラットフォーム管理者がテナント一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| keyword | string \| null | | キーワード検索 |
| status | string \| null | | ステータスフィルター |
| category | string \| null | | カテゴリーフィルター |
| page | number | ✓ | ページ番号 |
| limit | number | ✓ | 取得件数 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | TenantAdminSummary[] | テナント一覧 |
| totalCount | number | 総件数 |

### テストケース

- 一覧を取得できる
- フィルターが正しく動作する

---

## checkUrlPathAvailability — URLパスの使用可否を確認する

### 概要

テナント登録・編集時にURLパスが使用可能かをリアルタイムチェックする。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| urlPath | string | ✓ | 確認対象のURLパス |
| excludeTenantId | string \| null | | 除外するテナントID（編集時） |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| available | boolean | 使用可能か |

### テストケース

- 未使用のURLパスは available: true
- 使用中のURLパスは available: false
- 自テナントのURLパスは available: true（excludeTenantId指定時）
