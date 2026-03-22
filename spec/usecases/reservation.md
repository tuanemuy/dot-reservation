# Reservation ユースケース

## createReservation — 予約を作成する

### 概要

顧客が予約を作成する。承認方法に応じてステータスが「確定」または「承認待ち」になる。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| customerId | string | ✓ | 顧客ID |
| menuId | string | ✓ | メニューID |
| staffProfileId | string \| null | | スタッフID（指名なしの場合null） |
| date | string | ✓ | 予約日 |
| startTime | string | ✓ | 開始時刻 |
| note | string \| null | | 備考 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 予約ID |
| status | string | 予約ステータス |

### テストケース

- 自動承認テナントの場合「confirmed」ステータスで作成される
- 手動承認テナントの場合「pending」ステータスで作成される
- 「指名なし」の場合、空きスタッフが自動割り当てされる
- 指定枠が予約不可の場合 ConflictError
- 予約受付締切を過ぎている場合バリデーションエラー
- 予約受付期間外の場合バリデーションエラー
- 停止中のテナントの場合 ForbiddenError
- メニュー情報（名前、所要時間、料金）がスナップショットとして保存される
- 確認メールが送信される

---

## createProxyReservation — 予約を代理登録する

### 概要

管理者またはスタッフが顧客に代わって予約を登録する。常に「confirmed」ステータスで作成される。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| customerId | string \| null | | 既存顧客ID |
| customerName | string | ✓ | 顧客名 |
| customerEmail | string \| null | | 顧客メールアドレス |
| customerPhoneNumber | string \| null | | 顧客電話番号 |
| menuId | string | ✓ | メニューID |
| staffProfileId | string | ✓ | スタッフID |
| date | string | ✓ | 予約日 |
| startTime | string | ✓ | 開始時刻 |
| note | string \| null | | 備考 |
| createdBy | "admin" \| "staff" | ✓ | 作成者種別 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 予約ID |

### テストケース

- 正常に代理登録できる
- 常に「confirmed」ステータスで作成される
- 顧客メールアドレスがある場合、確認メールが送信される
- スタッフが作成する場合、自分の担当メニュー・シフト内のみ

---

## approveReservation — 予約を承認する

### 概要

管理者が承認待ちの予約を承認する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| reservationId | string | ✓ | 予約ID |

### 出力DTO

なし

### テストケース

- 正常に予約を承認できる（pending → confirmed）
- 承認待ち以外のステータスの場合 ConflictError
- 顧客に予約確定通知が送信される

---

## rejectReservation — 予約を却下する

### 概要

管理者が承認待ちの予約を却下する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| reservationId | string | ✓ | 予約ID |
| reason | string \| null | | 却下理由 |

### 出力DTO

なし

### テストケース

- 正常に予約を却下できる（pending → rejected）
- 承認待ち以外のステータスの場合 ConflictError
- 顧客に却下通知が送信される（理由を含む）

---

## updateReservation — 予約を変更する

### 概要

顧客・管理者・スタッフが予約内容を変更する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| reservationId | string | ✓ | 予約ID |
| menuId | string | ✓ | メニューID |
| staffProfileId | string \| null | | スタッフID |
| date | string | ✓ | 予約日 |
| startTime | string | ✓ | 開始時刻 |
| note | string \| null | | 備考 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 予約ID |
| status | string | 予約ステータス |

### テストケース

- 正常に予約を変更できる
- キャンセル期限を過ぎている場合（顧客操作時） ForbiddenError
- 完了・キャンセル済み・却下の予約は変更不可（ConflictError）
- 新しい時間枠が予約不可の場合 ConflictError
- 変更後のメニュー情報がスナップショットとして更新される
- 変更通知が送信される

---

## cancelReservation — 予約をキャンセルする

### 概要

顧客・管理者・スタッフが予約をキャンセルする。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| reservationId | string | ✓ | 予約ID |
| reason | string \| null | | キャンセル理由 |
| cancelledBy | "customer" \| "admin" \| "staff" | ✓ | キャンセル実行者種別 |

### 出力DTO

なし

### テストケース

- 正常に予約をキャンセルできる（confirmed/pending → cancelled）
- 顧客がキャンセル期限を過ぎてキャンセルしようとした場合 ForbiddenError
- 店舗側（admin/staff）はキャンセル期限に関係なくキャンセル可能
- 完了・キャンセル済み・却下の予約はキャンセル不可（ConflictError）
- キャンセル通知が送信される

---

## completeReservations — 予約を完了にする

### 概要

予約日時を過ぎた確定済み予約を完了ステータスに遷移させる（バッチ処理）。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| now | Date | ✓ | 現在日時 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| completedCount | number | 完了に遷移させた件数 |

### テストケース

- 予約終了時刻を過ぎた確定済み予約が「completed」に遷移する
- 承認待ち・キャンセル済み・却下の予約は対象外

---

## getReservation — 予約詳細を取得する

### 概要

予約の詳細情報を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| reservationId | string | ✓ | 予約ID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 予約ID |
| tenantId | string | テナントID |
| customerId | string \| null | 顧客ID |
| menuName | string | メニュー名 |
| menuDuration | number | 所要時間 |
| menuPrice | number | 料金 |
| staffName | string \| null | スタッフ名 |
| date | string | 予約日 |
| startTime | string | 開始時刻 |
| endTime | string | 終了時刻 |
| status | string | ステータス |
| customerName | string \| null | 顧客名 |
| customerEmail | string \| null | 顧客メール |
| customerPhoneNumber | string \| null | 顧客電話番号 |
| note | string \| null | 備考 |
| cancellationReason | string \| null | キャンセル理由 |
| rejectionReason | string \| null | 却下理由 |
| createdBy | string | 作成者種別 |
| createdAt | Date | 作成日時 |

### テストケース

- 予約詳細を取得できる
- 存在しない予約IDの場合 NotFoundError

---

## listReservations — 予約一覧を取得する

### 概要

条件に応じた予約一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | | テナントID（管理者/スタッフ用） |
| customerId | string | | 顧客ID（顧客用） |
| staffProfileId | string | | スタッフID（スタッフ用） |
| status | string \| null | | ステータスフィルター |
| startDate | string \| null | | 開始日フィルター |
| endDate | string \| null | | 終了日フィルター |
| page | number | ✓ | ページ番号 |
| limit | number | ✓ | 取得件数 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | ReservationSummary[] | 予約一覧 |
| totalCount | number | 総件数 |

### テストケース

- テナント全体の予約一覧を取得できる
- 顧客の予約一覧を取得できる
- スタッフの担当予約一覧を取得できる
- ステータス・日付範囲でフィルタリングできる
- ページネーションが正しく動作する

---

## getAvailableSlots — 空き状況を取得する

### 概要

指定条件の空き時間枠を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| menuId | string | ✓ | メニューID |
| staffProfileId | string \| null | | スタッフID（指名なしの場合null） |
| date | string | ✓ | 対象日付 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| slots | { startTime: string, available: boolean }[] | 時間枠と空き状況 |

### テストケース

- 営業時間内の時間枠が返される
- 既存予約がある枠は available: false
- スタッフのシフト外の枠は available: false
- バッファ時間が考慮される
- 「指名なし」の場合、いずれかのスタッフに空きがあれば available: true
- 休業日の場合は空配列
- 予約受付期間外の日付の場合は空配列
