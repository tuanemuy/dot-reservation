# Shift ユースケース

## createShift — シフトを登録する

### 概要

管理者がスタッフのシフトを登録する。繰り返しシフトにも対応。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| staffProfileId | string | ✓ | スタッフプロフィールID |
| date | string | ✓ | シフト日付 |
| startTime | string | ✓ | 開始時刻 |
| endTime | string | ✓ | 終了時刻 |
| recurring | boolean | ✓ | 繰り返し有無 |
| recurringEndDate | string \| null | | 繰り返し終了日 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| shiftIds | string[] | 作成されたシフトID（繰り返しの場合は複数） |

### テストケース

- 正常にシフトを登録できる
- 繰り返しシフト（毎週）を登録でき、終了日までの全週にシフトが作成される
- 営業時間外のシフトの場合バリデーションエラー
- 既存シフトと重複する場合 ConflictError

---

## updateShift — シフトを編集する

### 概要

管理者がシフトを編集する。繰り返しシフトの場合は「この日のみ」「以降すべて」を選択可能。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| shiftId | string | ✓ | シフトID |
| startTime | string | ✓ | 開始時刻 |
| endTime | string | ✓ | 終了時刻 |
| updateScope | "single" \| "future" | ✓ | 更新範囲 |

### 出力DTO

なし

### テストケース

- 単発シフトを正常に編集できる
- 繰り返しシフトの「この日のみ」を編集できる
- 繰り返しシフトの「以降すべて」を編集できる
- 既存シフトと重複する場合 ConflictError
- シフト内に予約がある場合に時間短縮しようとすると警告情報を返す

---

## deleteShift — シフトを削除する

### 概要

管理者がシフトを削除する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| shiftId | string | ✓ | シフトID |
| deleteScope | "single" \| "future" | ✓ | 削除範囲 |

### 出力DTO

なし

### テストケース

- 単発シフトを正常に削除できる
- 繰り返しシフトの「この日のみ」を削除できる
- 繰り返しシフトの「以降すべて」を削除できる
- 既存の予約は自動キャンセルされない

---

## listShifts — シフト一覧を取得する

### 概要

指定期間のシフト一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| startDate | string | ✓ | 開始日 |
| endDate | string | ✓ | 終了日 |
| staffProfileId | string \| null | | スタッフフィルター |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | ShiftDetail[] | シフト一覧 |

### テストケース

- 期間内のシフト一覧を取得できる
- スタッフでフィルタリングできる

---

## submitShiftRequests — シフト希望を提出する

### 概要

スタッフがシフト希望を提出する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| staffProfileId | string | ✓ | スタッフプロフィールID |
| tenantId | string | ✓ | テナントID |
| requests | { date, type, startTime?, endTime?, note? }[] | ✓ | 希望一覧 |

### 出力DTO

なし

### テストケース

- 正常にシフト希望を提出できる
- 提出済みの期間の場合、上書きされる
- 管理者にシフト希望提出の通知が送信される

---

## listShiftRequests — シフト希望を取得する

### 概要

指定期間のシフト希望一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| startDate | string | ✓ | 開始日 |
| endDate | string | ✓ | 終了日 |
| staffProfileId | string \| null | | スタッフフィルター |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | ShiftRequestDetail[] | シフト希望一覧 |

### テストケース

- 期間内のシフト希望一覧を取得できる
- スタッフでフィルタリングできる
