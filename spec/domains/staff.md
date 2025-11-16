# Staff ドメイン

## 概要

Staffドメインは、スタッフ情報とシフト管理を担当します。スタッフ情報（名前、画像、担当メニュー、スタッフタイプ）、スタッフタイプ管理（常勤・非常勤）、シフト管理（出勤時間、休み時間）、勤務可能時間の計算、スタッフ削除時の既存予約チェックを行います。

## エンティティ

### Staff

スタッフを表すエンティティ。

```typescript
export type StaffBase = Readonly<{
  id: StaffId;
  userId: UserId | null;
  name: StaffName;
  imageUrl: string | null;
  availableMenuIds: MenuId[];
  createdAt: Date;
  updatedAt: Date;
}>;

export type FullTimeStaff = StaffBase & {
  type: "full-time";
  defaultWorkingHours: WorkingHours;
};

export type PartTimeStaff = StaffBase & {
  type: "part-time";
};

export type Staff = FullTimeStaff | PartTimeStaff;
```

**ビジネスルール**:
- スタッフ名は必須
- UserIdは任意（アカウントを持たないスタッフも登録可能）
- 担当可能なメニューは複数選択可能
- 常勤スタッフはデフォルトの勤務時間を持つ
- 非常勤スタッフはシフトごとに勤務時間を設定

### Shift

シフトを表すエンティティ。

```typescript
export type Shift = Readonly<{
  id: ShiftId;
  staffId: StaffId;
  date: Date;
  workingHours: WorkingHours | null;
  isOff: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- 常勤スタッフの場合、`isOff = false` でworkingHoursが設定されている、または `isOff = true` で休み
- 非常勤スタッフの場合、`isOff = false` でworkingHoursが設定されている、または `isOff = true` で勤務なし
- 同じスタッフ・同じ日付のシフトは1つのみ

### WorkingHours

勤務時間を表す値オブジェクト。

```typescript
export type WorkingHours = Readonly<{
  periods: WorkingPeriod[];
}>;

export type WorkingPeriod = Readonly<{
  startTime: Time;
  endTime: Time;
}>;
```

**ビジネスルール**:
- 複数の勤務時間帯を設定可能（例: 午前9-12時、午後14-18時）
- 各時間帯の開始時刻は終了時刻より前
- 時間帯は重複しない

## 値オブジェクト

### StaffId

```typescript
export type StaffId = string & { readonly brand: "StaffId" };

export function createStaffId(id: string): StaffId;
export function generateStaffId(): StaffId;
```

### StaffName

```typescript
export type StaffName = string & { readonly brand: "StaffName" };

export function createStaffName(name: string): StaffName;
```

**バリデーション**:
- 1文字以上、50文字以内
- 空白のみは不可

### StaffType

```typescript
export type StaffType = "full-time" | "part-time";

export function createStaffType(type: string): StaffType;
```

### Time

時刻を表す値オブジェクト（HH:MM形式）。

```typescript
export type Time = string & { readonly brand: "Time" };

export function createTime(time: string): Time;
```

**バリデーション**:
- HH:MM形式（例: "09:00", "14:30"）
- 00:00 - 23:59の範囲

### ShiftId

```typescript
export type ShiftId = string & { readonly brand: "ShiftId" };

export function generateShiftId(): ShiftId;
```

## エラーコード

```typescript
export enum StaffErrorCode {
  // バリデーション
  InvalidStaffName = "INVALID_STAFF_NAME",
  InvalidTime = "INVALID_TIME",
  InvalidWorkingHours = "INVALID_WORKING_HOURS",
  OverlappingWorkingPeriods = "OVERLAPPING_WORKING_PERIODS",

  // 削除制約
  StaffHasActiveReservations = "STAFF_HAS_ACTIVE_RESERVATIONS",

  // シフト
  ShiftAlreadyExists = "SHIFT_ALREADY_EXISTS",
  ShiftConflictsWithReservation = "SHIFT_CONFLICTS_WITH_RESERVATION",

  // その他
  StaffNotFound = "STAFF_NOT_FOUND",
  ShiftNotFound = "SHIFT_NOT_FOUND",
}
```

## ポート

### StaffRepository

```typescript
export interface StaffRepository {
  save(staff: Staff): Promise<void>;
  findById(id: StaffId): Promise<Staff | null>;
  findByUserId(userId: UserId): Promise<Staff | null>;
  findAll(): Promise<Staff[]>;
  delete(id: StaffId): Promise<void>;
}
```

### ShiftRepository

```typescript
export interface ShiftRepository {
  save(shift: Shift): Promise<void>;
  findById(id: ShiftId): Promise<Shift | null>;
  findByStaffIdAndDate(staffId: StaffId, date: Date): Promise<Shift | null>;
  findByStaffIdAndDateRange(
    staffId: StaffId,
    startDate: Date,
    endDate: Date
  ): Promise<Shift[]>;
  delete(id: ShiftId): Promise<void>;
}
```

## ユースケース

### 1. createStaff

スタッフを作成する（管理者のみ）。

```typescript
export type CreateStaffInput = {
  userId?: string;
  name: string;
  image?: File;
  availableMenuIds: string[];
  type: string;
  defaultWorkingHours?: {
    periods: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
};

export async function createStaff(
  context: Context,
  input: CreateStaffInput
): Promise<Staff>;
```

**処理フロー**:
1. 管理者権限チェック
2. UserIdがある場合、ユーザーの存在確認
3. メニューの存在確認
4. 値オブジェクトの作成（バリデーション）
5. 画像がある場合、アップロード
6. Staffエンティティの作成
7. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: ユーザーまたはメニューが見つからない
- `BusinessRuleError`: バリデーションエラー
- `SystemError`: 画像アップロード失敗

### 2. updateStaff

スタッフ情報を更新する（管理者のみ）。

```typescript
export type UpdateStaffInput = {
  staffId: string;
  userId?: string;
  name?: string;
  image?: File;
  removeImage?: boolean;
  availableMenuIds?: string[];
  type?: string;
  defaultWorkingHours?: {
    periods: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
};

export async function updateStaff(
  context: Context,
  input: UpdateStaffInput
): Promise<Staff>;
```

**処理フロー**:
1. 管理者権限チェック
2. スタッフを検索
3. UserIdが変更される場合、ユーザーの存在確認
4. メニューが変更される場合、メニューの存在確認
5. 値オブジェクトの作成（バリデーション）
6. 画像が変更される場合:
   - 古い画像を削除
   - 新しい画像をアップロード
7. Staffエンティティの更新
8. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: スタッフ、ユーザー、メニューが見つからない
- `BusinessRuleError`: バリデーションエラー
- `SystemError`: 画像アップロード失敗

### 3. deleteStaff

スタッフを削除する（管理者のみ）。

```typescript
export type DeleteStaffInput = {
  staffId: string;
};

export async function deleteStaff(
  context: Context,
  input: DeleteStaffInput
): Promise<void>;
```

**処理フロー**:
1. 管理者権限チェック
2. スタッフを検索
3. 既存予約があるかチェック（有効な予約のみ）
4. 画像がある場合、削除
5. すべてのシフトを削除
6. スタッフを削除

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: スタッフが見つからない
- `BusinessRuleError`: 既存予約がある

### 4. getStaff

スタッフ詳細を取得する。

```typescript
export type GetStaffInput = {
  staffId: string;
};

export async function getStaff(
  context: Context,
  input: GetStaffInput
): Promise<Staff>;
```

**処理フロー**:
1. スタッフを検索
2. スタッフ情報を返却

**エラー**:
- `NotFoundError`: スタッフが見つからない

### 5. listStaff

スタッフ一覧を取得する。

```typescript
export type ListStaffInput = {
  menuId?: string;
};

export async function listStaff(
  context: Context,
  input: ListStaffInput
): Promise<Staff[]>;
```

**処理フロー**:
1. すべてのスタッフを検索
2. menuIdが指定されている場合、そのメニューを担当できるスタッフでフィルタリング
3. スタッフ一覧を返却

### 6. createOrUpdateShift

シフトを作成または更新する（管理者のみ）。

```typescript
export type CreateOrUpdateShiftInput = {
  staffId: string;
  date: Date;
  workingHours?: {
    periods: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
  isOff: boolean;
};

export async function createOrUpdateShift(
  context: Context,
  input: CreateOrUpdateShiftInput
): Promise<Shift>;
```

**処理フロー**:
1. 管理者権限チェック
2. スタッフを検索
3. 既存シフトを検索
4. 値オブジェクトの作成（バリデーション）
5. シフト変更により影響を受ける予約をチェック:
   - スタッフが勤務しない時間帯に予約がある場合、警告またはエラー
6. Shiftエンティティの作成または更新
7. データベースに保存

**エラー**:
- `ForbiddenError`: 管理者権限なし
- `NotFoundError`: スタッフが見つからない
- `BusinessRuleError`: バリデーションエラー、予約との競合

### 7. getShift

シフト詳細を取得する。

```typescript
export type GetShiftInput = {
  staffId: string;
  date: Date;
};

export async function getShift(
  context: Context,
  input: GetShiftInput
): Promise<Shift | null>;
```

**処理フロー**:
1. シフトを検索
2. シフト情報を返却（存在しない場合はnull）

### 8. getShiftsByDateRange

日付範囲でシフト一覧を取得する。

```typescript
export type GetShiftsByDateRangeInput = {
  staffId: string;
  startDate: Date;
  endDate: Date;
};

export async function getShiftsByDateRange(
  context: Context,
  input: GetShiftsByDateRangeInput
): Promise<Shift[]>;
```

**処理フロー**:
1. シフト一覧を検索
2. シフト一覧を返却

### 9. getStaffWorkingHours

特定の日のスタッフの勤務時間を取得する。

```typescript
export type GetStaffWorkingHoursInput = {
  staffId: string;
  date: Date;
};

export async function getStaffWorkingHours(
  context: Context,
  input: GetStaffWorkingHoursInput
): Promise<WorkingHours | null>;
```

**処理フロー**:
1. スタッフを検索
2. シフトを検索
3. シフトがある場合:
   - シフトのworkingHoursを返却
4. シフトがない場合:
   - 常勤スタッフ: defaultWorkingHoursを返却
   - 非常勤スタッフ: nullを返却

**エラー**:
- `NotFoundError`: スタッフが見つからない

### 10. checkStaffHasActiveReservations

スタッフに有効な予約があるかチェックする（内部ユースケース）。

```typescript
export type CheckStaffHasActiveReservationsInput = {
  staffId: string;
};

export async function checkStaffHasActiveReservations(
  context: Context,
  input: CheckStaffHasActiveReservationsInput
): Promise<boolean>;
```

**処理フロー**:
1. スタッフIDで有効な予約を検索
2. 予約が存在すれば true を返却

### 11. checkShiftConflictsWithReservations

シフト変更により影響を受ける予約があるかチェックする（内部ユースケース）。

```typescript
export type CheckShiftConflictsWithReservationsInput = {
  staffId: string;
  date: Date;
  workingHours: WorkingHours | null;
  isOff: boolean;
};

export async function checkShiftConflictsWithReservations(
  context: Context,
  input: CheckShiftConflictsWithReservationsInput
): Promise<Reservation[]>;
```

**処理フロー**:
1. 指定日のスタッフの予約を検索
2. 新しい勤務時間と予約時間を比較
3. 勤務時間外に予約がある場合、その予約のリストを返却

## 補足

### シフト管理の柔軟性

シフト管理は以下の2つのパターンをサポートします:

1. **常勤スタッフ**:
   - デフォルトの勤務時間を設定
   - 休む日や時間のみシフトを登録
   - シフト未登録の日はデフォルト勤務時間で勤務

2. **非常勤スタッフ**:
   - デフォルト勤務時間なし
   - 出勤する日と時間をシフトで登録
   - シフト未登録の日は勤務なし

### シフト変更と予約の整合性

シフト変更により、既存予約との競合が発生する可能性があります。以下のアプローチが考えられます:

1. **厳格なチェック**: 予約がある場合はシフト変更を禁止
2. **警告表示**: 予約があることを警告し、管理者の判断に委ねる
3. **自動調整**: 予約を別のスタッフに自動振り分け（高度な機能）

現在の設計では、警告表示のアプローチを推奨します。

### 勤務時間の計算

予約可能な時間枠を計算する際、以下の要素を考慮します:

1. 営業時間（Clinicドメイン）
2. スタッフの勤務時間（Staffドメイン）
3. 臨時休業（Clinicドメイン）
4. 既存予約（Reservationドメイン）

これらを組み合わせて、実際に予約可能な時間枠を算出します。

### 拡張性

- スタッフの休憩時間管理
- スタッフの稼働率・生産性分析
- スタッフごとの予約ルール（最大予約数など）
- スタッフのスキルレベル管理
- 複数店舗での勤務対応
