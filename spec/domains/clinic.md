# Clinic ドメイン

## 概要

Clinicドメインは、店舗情報と運営設定の管理を担当します。店舗情報（名前、住所、電話番号）、営業時間（曜日ごとの営業時間、定休日）、臨時休業、予約設定（予約枠間隔、最大予約数、各種期限、リマインド設定）を管理します。

## エンティティ

### Clinic

クリニック（店舗）を表すエンティティ。システム全体で1つのみ存在します。

```typescript
export type Clinic = Readonly<{
  id: ClinicId;
  name: ClinicName;
  postalCode: PostalCode;
  prefecture: Prefecture;
  city: string;
  streetAddress: string;
  building: string | null;
  phoneNumber: PhoneNumber;
  email: Email;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- システム全体で1つのクリニックのみ
- 名前、住所、電話番号は必須
- Emailは任意（問い合わせ用）

### BusinessHours

営業時間を表すエンティティ。

```typescript
export type BusinessHours = Readonly<{
  id: BusinessHoursId;
  clinicId: ClinicId;
  dayOfWeek: DayOfWeek;
  periods: TimePeriod[];
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type TimePeriod = Readonly<{
  startTime: Time;
  endTime: Time;
}>;
```

**ビジネスルール**:
- 曜日ごとに設定
- 複数の営業時間帯を設定可能（例: 午前9-12時、午後14-18時）
- 定休日の場合は `isClosed = true`
- 時間帯は重複しない

### TemporaryClosure

臨時休業を表すエンティティ。

```typescript
export type TemporaryClosure = Readonly<{
  id: TemporaryClosureId;
  clinicId: ClinicId;
  date: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- 日付単位で設定
- 既存予約がある日は設定不可
- 理由は任意

### ReservationSettings

予約設定を表すエンティティ。

```typescript
export type ReservationSettings = Readonly<{
  id: ReservationSettingsId;
  clinicId: ClinicId;

  // 予約枠設定
  slotDurationMinutes: number;
  maxReservationsPerSlot: number;

  // 期限設定（単位: 時間）
  reservationDeadlineHours: number;
  cancellationDeadlineHours: number;
  updateDeadlineHours: number;

  // リマインドメール設定
  reminderEnabled: boolean;
  reminderHoursBefore: number;

  // スタッフ選択設定
  staffSelectionRequired: boolean;

  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- システム全体で1つの設定のみ
- 予約枠の時間間隔は1分以上
- 最大予約数は1以上
- 各期限は0以上
- リマインド送信時刻は0以上

## 値オブジェクト

### ClinicId / BusinessHoursId / TemporaryClosureId / ReservationSettingsId

```typescript
export type ClinicId = string & { readonly brand: "ClinicId" };
export type BusinessHoursId = string & { readonly brand: "BusinessHoursId" };
export type TemporaryClosureId = string & { readonly brand: "TemporaryClosureId" };
export type ReservationSettingsId = string & { readonly brand: "ReservationSettingsId" };

export function createClinicId(id: string): ClinicId;
export function generateBusinessHoursId(): BusinessHoursId;
export function generateTemporaryClosureId(): TemporaryClosureId;
export function generateReservationSettingsId(): ReservationSettingsId;
```

### ClinicName

```typescript
export type ClinicName = string & { readonly brand: "ClinicName" };

export function createClinicName(name: string): ClinicName;
```

**バリデーション**:
- 1文字以上、100文字以内
- 空白のみは不可

### DayOfWeek

```typescript
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function createDayOfWeek(day: number): DayOfWeek;
```

**値**:
- 0: 日曜日
- 1: 月曜日
- 2: 火曜日
- 3: 水曜日
- 4: 木曜日
- 5: 金曜日
- 6: 土曜日

## エラーコード

```typescript
export enum ClinicErrorCode {
  // バリデーション
  InvalidClinicName = "INVALID_CLINIC_NAME",
  InvalidDayOfWeek = "INVALID_DAY_OF_WEEK",
  InvalidTimePeriod = "INVALID_TIME_PERIOD",
  OverlappingTimePeriods = "OVERLAPPING_TIME_PERIODS",
  InvalidSlotDuration = "INVALID_SLOT_DURATION",
  InvalidMaxReservations = "INVALID_MAX_RESERVATIONS",
  InvalidDeadline = "INVALID_DEADLINE",

  // 臨時休業
  ClosureDateHasReservations = "CLOSURE_DATE_HAS_RESERVATIONS",
  ClosureAlreadyExists = "CLOSURE_ALREADY_EXISTS",

  // その他
  ClinicNotFound = "CLINIC_NOT_FOUND",
  BusinessHoursNotFound = "BUSINESS_HOURS_NOT_FOUND",
  TemporaryClosureNotFound = "TEMPORARY_CLOSURE_NOT_FOUND",
  ReservationSettingsNotFound = "RESERVATION_SETTINGS_NOT_FOUND",
}
```

## ポート

### ClinicRepository

```typescript
export interface ClinicRepository {
  save(clinic: Clinic): Promise<void>;
  find(): Promise<Clinic | null>;
}
```

### BusinessHoursRepository

```typescript
export interface BusinessHoursRepository {
  save(hours: BusinessHours): Promise<void>;
  findByDayOfWeek(clinicId: ClinicId, dayOfWeek: DayOfWeek): Promise<BusinessHours | null>;
  findAll(clinicId: ClinicId): Promise<BusinessHours[]>;
  delete(id: BusinessHoursId): Promise<void>;
}
```

### TemporaryClosureRepository

```typescript
export interface TemporaryClosureRepository {
  save(closure: TemporaryClosure): Promise<void>;
  findById(id: TemporaryClosureId): Promise<TemporaryClosure | null>;
  findByDate(clinicId: ClinicId, date: Date): Promise<TemporaryClosure | null>;
  findByDateRange(
    clinicId: ClinicId,
    startDate: Date,
    endDate: Date
  ): Promise<TemporaryClosure[]>;
  delete(id: TemporaryClosureId): Promise<void>;
}
```

### ReservationSettingsRepository

```typescript
export interface ReservationSettingsRepository {
  save(settings: ReservationSettings): Promise<void>;
  find(clinicId: ClinicId): Promise<ReservationSettings | null>;
}
```

## ユースケース

### 1. createOrUpdateClinic

クリニック情報を作成または更新する（管理者のみ）。

```typescript
export type CreateOrUpdateClinicInput = {
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  streetAddress: string;
  building?: string;
  phoneNumber: string;
  email?: string;
  description?: string;
};

export async function createOrUpdateClinic(
  context: Context,
  input: CreateOrUpdateClinicInput
): Promise<Clinic>;
```

**処理フロー**:
1. 管理者権限チェック
2. 既存のクリニックを検索
3. 値オブジェクトの作成（バリデーション）
4. Clinicエンティティの作成または更新
5. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `BusinessRuleError`: バリデーションエラー

### 2. getClinic

クリニック情報を取得する。

```typescript
export async function getClinic(context: Context): Promise<Clinic | null>;
```

**処理フロー**:
1. クリニックを検索
2. クリニック情報を返却

### 3. createOrUpdateBusinessHours

営業時間を作成または更新する（管理者のみ）。

```typescript
export type CreateOrUpdateBusinessHoursInput = {
  dayOfWeek: number;
  periods?: Array<{
    startTime: string;
    endTime: string;
  }>;
  isClosed: boolean;
};

export async function createOrUpdateBusinessHours(
  context: Context,
  input: CreateOrUpdateBusinessHoursInput
): Promise<BusinessHours>;
```

**処理フロー**:
1. 管理者権限チェック
2. クリニックを検索
3. 既存の営業時間を検索
4. 値オブジェクトの作成（バリデーション）
5. 時間帯の重複チェック
6. BusinessHoursエンティティの作成または更新
7. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: クリニックが見つからない
- `BusinessRuleError`: バリデーションエラー、時間帯の重複

### 4. getBusinessHours

営業時間を取得する。

```typescript
export type GetBusinessHoursInput = {
  dayOfWeek?: number;
};

export async function getBusinessHours(
  context: Context,
  input: GetBusinessHoursInput
): Promise<BusinessHours | BusinessHours[]>;
```

**処理フロー**:
1. クリニックを検索
2. dayOfWeekが指定されている場合:
   - その曜日の営業時間を返却
3. 指定されていない場合:
   - すべての曜日の営業時間を返却

### 5. createTemporaryClosure

臨時休業を作成する（管理者のみ）。

```typescript
export type CreateTemporaryClosureInput = {
  date: Date;
  reason?: string;
};

export async function createTemporaryClosure(
  context: Context,
  input: CreateTemporaryClosureInput
): Promise<TemporaryClosure>;
```

**処理フロー**:
1. 管理者権限チェック
2. クリニックを検索
3. 既存の臨時休業をチェック（重複防止）
4. 指定日に予約があるかチェック
5. TemporaryClosureエンティティの作成
6. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: クリニックが見つからない
- `ConflictError`: 臨時休業が既に存在
- `BusinessRuleError`: 予約がある

### 6. deleteTemporaryClosure

臨時休業を削除する（管理者のみ）。

```typescript
export type DeleteTemporaryClosureInput = {
  closureId: string;
};

export async function deleteTemporaryClosure(
  context: Context,
  input: DeleteTemporaryClosureInput
): Promise<void>;
```

**処理フロー**:
1. 管理者権限チェック
2. 臨時休業を検索
3. 臨時休業を削除

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: 臨時休業が見つからない

### 7. getTemporaryClosures

臨時休業一覧を取得する。

```typescript
export type GetTemporaryClosuresInput = {
  startDate: Date;
  endDate: Date;
};

export async function getTemporaryClosures(
  context: Context,
  input: GetTemporaryClosuresInput
): Promise<TemporaryClosure[]>;
```

**処理フロー**:
1. クリニックを検索
2. 日付範囲で臨時休業を検索
3. 臨時休業一覧を返却

### 8. createOrUpdateReservationSettings

予約設定を作成または更新する（管理者のみ）。

```typescript
export type CreateOrUpdateReservationSettingsInput = {
  slotDurationMinutes: number;
  maxReservationsPerSlot: number;
  reservationDeadlineHours: number;
  cancellationDeadlineHours: number;
  updateDeadlineHours: number;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  staffSelectionRequired: boolean;
};

export async function createOrUpdateReservationSettings(
  context: Context,
  input: CreateOrUpdateReservationSettingsInput
): Promise<ReservationSettings>;
```

**処理フロー**:
1. 管理者権限チェック
2. クリニックを検索
3. 既存の予約設定を検索
4. 値オブジェクトの作成（バリデーション）
5. ReservationSettingsエンティティの作成または更新
6. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: クリニックが見つからない
- `BusinessRuleError`: バリデーションエラー

### 9. getReservationSettings

予約設定を取得する。

```typescript
export async function getReservationSettings(
  context: Context
): Promise<ReservationSettings | null>;
```

**処理フロー**:
1. クリニックを検索
2. 予約設定を検索
3. 予約設定を返却

### 10. isClinicOpen

クリニックが営業中かチェックする（内部ユースケース）。

```typescript
export type IsClinicOpenInput = {
  dateTime: Date;
};

export async function isClinicOpen(
  context: Context,
  input: IsClinicOpenInput
): Promise<boolean>;
```

**処理フロー**:
1. クリニックを検索
2. 日付から曜日を取得
3. 営業時間を検索
4. 臨時休業をチェック
5. 営業中かどうかを判定して返却

### 11. getOpeningHours

指定日の営業時間を取得する（内部ユースケース）。

```typescript
export type GetOpeningHoursInput = {
  date: Date;
};

export async function getOpeningHours(
  context: Context,
  input: GetOpeningHoursInput
): Promise<TimePeriod[] | null>;
```

**処理フロー**:
1. クリニックを検索
2. 日付から曜日を取得
3. 営業時間を検索
4. 臨時休業をチェック
5. 臨時休業の場合はnullを返却
6. それ以外は営業時間の時間帯リストを返却

## 補足

### シングルトンパターン

Clinicエンティティは、システム全体で1つのみ存在します（シングルトン）。複数店舗に対応する場合は、別途設計が必要になります。

### 営業時間の柔軟性

営業時間は曜日ごとに複数の時間帯を設定できます。例:
- 月曜日: 9:00-12:00, 14:00-18:00
- 火曜日: 9:00-12:00（午後休診）
- 水曜日: 定休日

### 臨時休業と予約の整合性

臨時休業を設定する際、既存予約がある場合は設定を拒否します。これにより、予約の整合性を保ちます。

管理者が臨時休業を設定したい場合は、以下の手順を踏む必要があります:
1. その日の予約を確認
2. 予約がある場合、顧客に連絡してキャンセルまたは変更
3. すべての予約を処理した後、臨時休業を設定

### 予約受付期限の計算

予約受付期限は、予約開始時刻から逆算して計算します。例:
- 予約開始時刻: 2025-11-20 10:00
- 予約受付期限: 3日前の23:59
- 受付締切: 2025-11-17 23:59

### 拡張性

- 複数店舗対応
- 店舗ごとの営業カレンダー（祝日対応など）
- 営業時間の例外設定（特定日のみ営業時間変更）
- 季節営業（夏季・冬季で営業時間変更）
