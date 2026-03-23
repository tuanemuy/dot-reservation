# Shift ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| シフト（Shift） | スタッフの勤務スケジュール |
| シフト希望（ShiftRequest） | スタッフが提出するシフトの希望 |
| 繰り返しシフト（RecurringShift） | 毎週繰り返すシフト |
| 時間帯（TimeRange） | 開始時刻と終了時刻のペア |

## エンティティ

### Shift（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | ShiftId | シフトID |
| tenantId | TenantId | テナントID |
| staffProfileId | StaffProfileId | スタッフプロフィールID |
| date | Date | シフト日付 |
| timeRange | TimeRange | 勤務時間帯 |
| recurringGroupId | RecurringGroupId \| null | 繰り返しグループID（繰り返しシフトの場合） |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Shift.create(params)` — シフトを作成する
- `Shift.update(shift, params)` — シフトを更新する
- `Shift.isRecurring(shift)` — 繰り返しシフトかを判定する
- `Shift.containsTime(shift, time)` — 指定時刻がシフト内かを判定する

### ShiftRequest（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | ShiftRequestId | シフト希望ID |
| tenantId | TenantId | テナントID |
| staffProfileId | StaffProfileId | スタッフプロフィールID |
| date | Date | 対象日付 |
| type | ShiftRequestType | 希望タイプ（勤務希望 / 休み希望） |
| timeRange | TimeRange \| null | 希望時間帯（勤務希望の場合） |
| note | string \| null | 備考 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `ShiftRequest.create(params)` — シフト希望を作成する
- `ShiftRequest.update(request, params)` — シフト希望を更新する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| ShiftId | string (branded) | UUID形式 |
| ShiftRequestId | string (branded) | UUID形式 |
| RecurringGroupId | string (branded) | UUID形式 |
| TimeRange | { start: TimeOfDay, end: TimeOfDay } | start < end |
| TimeOfDay | string (branded) | HH:MM形式、15分単位 |
| ShiftRequestType | "work" \| "off" | — |

## ドメインサービス

### ShiftConflictChecker

シフトの重複を検証する。リポジトリに依存せず、必要なデータを引数として受け取る純粋関数として実装する。

- `hasConflict(existingShifts: Shift[], date: Date, timeRange: TimeRange, excludeShiftId?: ShiftId): boolean` — 既存シフト一覧から、指定日・時間帯と重複するシフトがあるかを検証する

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| shift.created | shiftId, tenantId, staffProfileId | シフト作成時 |
| shiftRequest.submitted | staffProfileId, tenantId | シフト希望提出時 |

## ポート

### ShiftRepository

- `save(shift: Shift): Promise<void>`
- `findById(id: ShiftId): Promise<Shift | null>`
- `findByTenantIdAndDateRange(tenantId: TenantId, startDate: Date, endDate: Date): Promise<Shift[]>`
- `findByStaffProfileIdAndDateRange(staffProfileId: StaffProfileId, startDate: Date, endDate: Date): Promise<Shift[]>`
- `findByRecurringGroupId(groupId: RecurringGroupId): Promise<Shift[]>`
- `delete(id: ShiftId): Promise<void>`
- `deleteByRecurringGroupIdFromDate(groupId: RecurringGroupId, fromDate: Date): Promise<void>`

### ShiftRequestRepository

- `save(request: ShiftRequest): Promise<void>`
- `findByStaffProfileIdAndDateRange(staffProfileId: StaffProfileId, startDate: Date, endDate: Date): Promise<ShiftRequest[]>`
- `findByTenantIdAndDateRange(tenantId: TenantId, startDate: Date, endDate: Date): Promise<ShiftRequest[]>`
- `deleteByStaffProfileIdAndDateRange(staffProfileId: StaffProfileId, startDate: Date, endDate: Date): Promise<void>`

## ユースケース（概要）

- シフトを登録する（単発 / 繰り返し）
- シフトを編集する（この日のみ / 以降すべて）
- シフトを削除する（この日のみ / 以降すべて）
- シフト一覧を取得する（テナント全体 / スタッフ別）
- シフト希望を提出する
- シフト希望を取得する
