# Reservation ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| 予約（Reservation） | 顧客が特定の店舗・メニュー・スタッフ・日時で行う予約 |
| 予約ステータス（ReservationStatus） | 予約の状態（承認待ち / 確定 / 完了 / キャンセル済み / 却下） |
| 予約枠（TimeSlot） | 予約可能な時間帯の単位 |
| 空き状況（Availability） | 特定日時の予約可能状態 |

## エンティティ

### Reservation（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | ReservationId | 予約ID |
| tenantId | TenantId | テナントID |
| customerId | CustomerId \| null | 顧客ID（代理登録で顧客未指定の場合null） |
| menuId | MenuId | メニューID |
| staffProfileId | StaffProfileId \| null | 担当スタッフID（指名なしの場合、確定時に割り当て） |
| date | Date | 予約日 |
| startTime | TimeOfDay | 開始時刻 |
| endTime | TimeOfDay | 終了時刻 |
| status | ReservationStatus | 予約ステータス |
| menuName | string | メニュー名（予約時点のスナップショット） |
| menuDuration | number | 所要時間（予約時点のスナップショット） |
| menuPrice | number | 料金（予約時点のスナップショット） |
| staffName | string \| null | スタッフ名（予約時点のスナップショット） |
| customerName | string \| null | 顧客名（代理登録時の入力値 or 顧客の表示名） |
| customerEmail | string \| null | 顧客メールアドレス |
| customerPhoneNumber | string \| null | 顧客電話番号 |
| note | string \| null | 備考 |
| cancellationReason | string \| null | キャンセル理由 |
| rejectionReason | string \| null | 却下理由 |
| createdBy | "customer" \| "admin" \| "staff" | 作成者種別 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Reservation.create(params)` — 予約を作成する（ステータスは承認方法に依存）
- `Reservation.approve(reservation)` — 予約を承認する（承認待ち → 確定）
- `Reservation.reject(reservation, reason)` — 予約を却下する（承認待ち → 却下）
- `Reservation.cancel(reservation, reason)` — 予約をキャンセルする（確定/承認待ち → キャンセル済み）
- `Reservation.complete(reservation)` — 予約を完了にする（確定 → 完了）
- `Reservation.update(reservation, params)` — 予約内容を変更する
- `Reservation.canCancel(reservation, settings, now)` — キャンセル可能かを判定する
- `Reservation.canModify(reservation, settings, now)` — 変更可能かを判定する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| ReservationId | string (branded) | UUID形式 |
| ReservationStatus | "pending" \| "confirmed" \| "completed" \| "cancelled" \| "rejected" | — |
| TimeSlot | { date: Date, startTime: TimeOfDay, endTime: TimeOfDay } | startTime < endTime |

## ドメインサービス

### AvailabilityService

空き状況を計算する。他ドメインのデータはアプリケーション層から引数として渡される（ドメイン間の直接依存を避ける）。

- `getAvailableSlots(params: { businessHours, regularHolidays, temporaryHolidays, reservationSettings, shifts, existingReservations, menuDuration, date })` — 指定条件の空き時間枠を取得する
- `isSlotAvailable(params: { shifts, existingReservations, reservationSettings, staffProfileId, date, startTime, endTime })` — 指定枠が予約可能かを検証する

### StaffAssignmentService

「指名なし」予約のスタッフ割り当てを行う。

- `assignStaff(tenantId, menuId, date, startTime, endTime)` — 空きのあるスタッフを自動割り当てする

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| reservation.created | reservationId, tenantId, customerId, status | 予約作成時 |
| reservation.approved | reservationId, tenantId, customerId | 予約承認時 |
| reservation.rejected | reservationId, tenantId, customerId, reason | 予約却下時 |
| reservation.cancelled | reservationId, tenantId, customerId, cancelledBy, reason | 予約キャンセル時 |
| reservation.completed | reservationId, tenantId | 予約完了時 |
| reservation.updated | reservationId, tenantId, customerId | 予約変更時 |

## ポート

### ReservationRepository

- `save(reservation: Reservation): Promise<void>`
- `findById(id: ReservationId): Promise<Reservation | null>`
- `findByTenantId(tenantId: TenantId, filter, pagination): Promise<PaginationResult<Reservation>>`
- `findByCustomerId(customerId: CustomerId, filter, pagination): Promise<PaginationResult<Reservation>>`
- `findByStaffProfileId(staffProfileId: StaffProfileId, filter, pagination): Promise<PaginationResult<Reservation>>`
- `findByTenantIdAndDateRange(tenantId: TenantId, startDate: Date, endDate: Date): Promise<Reservation[]>`
- `findByStaffProfileIdAndDateRange(staffProfileId: StaffProfileId, startDate: Date, endDate: Date): Promise<Reservation[]>`
- `countByCustomerIdAndStatusAndDateAfter(customerId: CustomerId, status: ReservationStatus, date: Date): Promise<number>`
- `countByTenantId(tenantId: TenantId): Promise<number>`
- `countByTenantIdAndMonth(tenantId: TenantId, year: number, month: number): Promise<number>`
- `findConfirmedEndedBefore(before: Date): Promise<Reservation[]>`

## ユースケース（概要）

- 予約を作成する（顧客）
- 予約を代理登録する（管理者 / スタッフ）
- 予約を承認する（管理者）
- 予約を却下する（管理者）
- 予約を変更する（顧客 / 管理者 / スタッフ）
- 予約をキャンセルする（顧客 / 管理者 / スタッフ）
- 予約を完了にする（システム / バッチ処理）
- 予約一覧を取得する（顧客 / 管理者 / スタッフ）
- 予約詳細を取得する
- 空き状況を取得する
