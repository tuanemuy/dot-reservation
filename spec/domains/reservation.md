# Reservation ドメイン

## 概要

Reservationドメインは、予約のライフサイクル管理を担当します。予約の作成、変更、キャンセル、来院確認、No-show処理を管理し、予約枠の空き状況管理、重複予約の防止、予約期限チェックを行います。

## エンティティ

### Reservation

予約を表すエンティティ。

```typescript
export type ReservationBase = Readonly<{
  id: ReservationId;
  customerId: CustomerId;
  menuId: MenuId;
  staffId: StaffId | null;
  startTime: Date;
  endTime: Date;
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}>;

export type PendingReservation = ReservationBase & {
  status: "pending";
};

export type ConfirmedReservation = ReservationBase & {
  status: "confirmed";
};

export type CancelledReservation = ReservationBase & {
  status: "cancelled";
  cancelledBy: UserId;
  cancelledAt: Date;
  cancellationReason: string | null;
};

export type ArrivedReservation = ReservationBase & {
  status: "arrived";
  arrivedAt: Date;
};

export type NoShowReservation = ReservationBase & {
  status: "no-show";
  noShowReason: string | null;
};

export type Reservation =
  | PendingReservation
  | ConfirmedReservation
  | CancelledReservation
  | ArrivedReservation
  | NoShowReservation;
```

**ビジネスルール**:
- 開始時刻は現在時刻より未来でなければならない
- 終了時刻は開始時刻より後でなければならない
- スタッフは任意（管理者設定による）
- 同じ顧客は同じ時間帯に重複予約できない
- 予約受付期限を過ぎている時間帯は予約できない
- 満席の時間帯は予約できない

**状態遷移**:
- 作成時: `pending`
- 確定後: `confirmed`
- キャンセル: `cancelled`（pending/confirmedから遷移可能）
- 来院確認: `arrived`（confirmedから遷移可能）
- No-show: `no-show`（confirmedから遷移可能）

### TimeSlot

予約可能な時間枠を表す値オブジェクト（エンティティではなく計算結果）。

```typescript
export type TimeSlot = Readonly<{
  startTime: Date;
  endTime: Date;
  capacity: number;
  reservedCount: number;
  available: boolean;
  staffId: StaffId | null;
}>;
```

**ビジネスルール**:
- 容量は予約設定の最大予約数
- 予約済み数が容量に達したら`available = false`
- スタッフ指定がある場合、そのスタッフの勤務時間内のみ

### ReservationConstraints

予約制約を表す値オブジェクト（Storeドメインの設定から取得）。

```typescript
export type ReservationConstraints = Readonly<{
  slotDurationMinutes: number;
  maxReservationsPerSlot: number;
  reservationDeadlineHours: number;
  cancellationDeadlineHours: number;
  updateDeadlineHours: number;
}>;
```

## 値オブジェクト

### ReservationId

```typescript
export type ReservationId = string & { readonly brand: "ReservationId" };

export function createReservationId(id: string): ReservationId;
export function generateReservationId(): ReservationId;
```

### ReservationStatus

```typescript
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "arrived" | "no-show";

export function createReservationStatus(status: string): ReservationStatus;
```

### ReservationTimeRange

予約時間範囲を表す値オブジェクト。

```typescript
export type ReservationTimeRange = Readonly<{
  startTime: Date;
  endTime: Date;
}>;

export function createReservationTimeRange(
  startTime: Date,
  endTime: Date
): ReservationTimeRange;
```

**バリデーション**:
- 開始時刻は終了時刻より前
- 開始時刻は現在時刻より未来

## エラーコード

```typescript
export enum ReservationErrorCode {
  // 時間関連
  InvalidTimeRange = "INVALID_TIME_RANGE",
  PastReservationTime = "PAST_RESERVATION_TIME",
  ReservationDeadlinePassed = "RESERVATION_DEADLINE_PASSED",
  CancellationDeadlinePassed = "CANCELLATION_DEADLINE_PASSED",
  UpdateDeadlinePassed = "UPDATE_DEADLINE_PASSED",

  // 予約枠関連
  SlotFull = "SLOT_FULL",
  SlotNotAvailable = "SLOT_NOT_AVAILABLE",
  DuplicateReservation = "DUPLICATE_RESERVATION",

  // スタッフ関連
  StaffNotAvailable = "STAFF_NOT_AVAILABLE",
  StaffRequired = "STAFF_REQUIRED",

  // 状態関連
  InvalidReservationStatus = "INVALID_RESERVATION_STATUS",
  CannotCancelReservation = "CANNOT_CANCEL_RESERVATION",
  CannotUpdateReservation = "CANNOT_UPDATE_RESERVATION",
  ReservationNotFound = "RESERVATION_NOT_FOUND",
}
```

## ポート

### ReservationRepository

```typescript
export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: ReservationId): Promise<Reservation | null>;
  findByCustomerId(customerId: CustomerId): Promise<Reservation[]>;
  findByStaffId(staffId: StaffId, startDate: Date, endDate: Date): Promise<Reservation[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]>;
  findOverlappingReservations(
    customerId: CustomerId,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: ReservationId
  ): Promise<Reservation[]>;
  countByTimeSlot(startTime: Date, endTime: Date, staffId?: StaffId): Promise<number>;
}
```

### TimeSlotCalculator

時間枠の計算を行うポート。

```typescript
export interface TimeSlotCalculator {
  calculateAvailableSlots(
    date: Date,
    menuId: MenuId,
    staffId: StaffId | null,
    constraints: ReservationConstraints
  ): Promise<TimeSlot[]>;
}
```

## ユースケース

### 1. createReservation

予約を作成する（顧客側）。

```typescript
export type CreateReservationInput = {
  menuId: string;
  staffId?: string;
  startTime: Date;
};

export async function createReservation(
  context: Context,
  input: CreateReservationInput
): Promise<Reservation>;
```

**処理フロー**:
1. 認証チェック（ログイン必須）
2. 顧客情報を取得
3. メニュー情報を取得
4. スタッフ情報を取得（指定がある場合）
5. 予約制約を取得
6. 終了時刻を計算（startTime + メニューの所要時間）
7. 予約可能かチェック:
   - 過去の時刻でないか
   - 予約受付期限を過ぎていないか
   - スタッフが勤務中か（指定がある場合）
   - 枠が満席でないか
   - 顧客の重複予約がないか
8. Reservationエンティティの作成（status: confirmed）
9. データベースに保存（トランザクション）
10. 予約確認メールの送信

**エラー**:
- `UnauthenticatedError`: 未認証
- `NotFoundError`: メニューまたはスタッフが見つからない
- `BusinessRuleError`: 時間不正、期限切れ、スタッフ不在
- `ConflictError`: 満席、重複予約

### 2. createReservationByStaff

予約を作成する（スタッフ側）。

```typescript
export type CreateReservationByStaffInput = {
  customerId: string;
  menuId: string;
  staffId?: string;
  startTime: Date;
  sendEmail?: boolean;
};

export async function createReservationByStaff(
  context: Context,
  input: CreateReservationByStaffInput
): Promise<Reservation>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 顧客、メニュー、スタッフ情報を取得
3. 予約制約を取得
4. 終了時刻を計算
5. 予約可能かチェック（期限チェックは緩和）
6. Reservationエンティティの作成（status: confirmed）
7. データベースに保存
8. オプションでメール送信

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 顧客、メニュー、スタッフが見つからない
- `BusinessRuleError`: 時間不正、スタッフ不在
- `ConflictError`: 満席、重複予約

### 3. updateReservation

予約を変更する（顧客側）。

```typescript
export type UpdateReservationInput = {
  reservationId: string;
  menuId?: string;
  staffId?: string;
  startTime?: Date;
};

export async function updateReservation(
  context: Context,
  input: UpdateReservationInput
): Promise<Reservation>;
```

**処理フロー**:
1. 認証チェック
2. 予約を検索
3. 権限チェック（自分の予約か）
4. ステータスチェック（confirmed のみ変更可能）
5. 変更期限チェック
6. 変更内容がある場合:
   - 新しいメニュー/スタッフ情報を取得
   - 新しい終了時刻を計算
   - 予約可能かチェック
7. Reservationエンティティの更新
8. データベースに保存
9. 変更通知メールの送信

**エラー**:
- `UnauthenticatedError`: 未認証
- `NotFoundError`: 予約、メニュー、スタッフが見つからない
- `ForbiddenError`: 権限なし
- `BusinessRuleError`: ステータス不正、期限切れ、時間不正
- `ConflictError`: 満席、重複予約

### 4. updateReservationByStaff

予約を変更する（スタッフ側）。

```typescript
export type UpdateReservationByStaffInput = {
  reservationId: string;
  customerId?: string;
  menuId?: string;
  staffId?: string;
  startTime?: Date;
};

export async function updateReservationByStaff(
  context: Context,
  input: UpdateReservationByStaffInput
): Promise<Reservation>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 予約を検索
3. ステータスチェック（cancelled, no-showは変更不可）
4. 変更内容がある場合:
   - 新しい顧客/メニュー/スタッフ情報を取得
   - 新しい終了時刻を計算
   - 予約可能かチェック（期限チェックは緩和）
5. Reservationエンティティの更新
6. データベースに保存
7. 変更通知メールの送信

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 予約、顧客、メニュー、スタッフが見つからない
- `BusinessRuleError`: ステータス不正、時間不正
- `ConflictError`: 満席、重複予約

### 5. cancelReservation

予約をキャンセルする（顧客側）。

```typescript
export type CancelReservationInput = {
  reservationId: string;
};

export async function cancelReservation(
  context: Context,
  input: CancelReservationInput
): Promise<Reservation>;
```

**処理フロー**:
1. 認証チェック
2. 予約を検索
3. 権限チェック（自分の予約か）
4. ステータスチェック（confirmed のみキャンセル可能）
5. キャンセル期限チェック
6. Reservationエンティティの更新（status: cancelled）
7. データベースに保存
8. キャンセル通知メールの送信

**エラー**:
- `UnauthenticatedError`: 未認証
- `NotFoundError`: 予約が見つからない
- `ForbiddenError`: 権限なし
- `BusinessRuleError`: ステータス不正、期限切れ

### 6. cancelReservationByStaff

予約をキャンセルする（スタッフ側）。

```typescript
export type CancelReservationByStaffInput = {
  reservationId: string;
  reason?: string;
};

export async function cancelReservationByStaff(
  context: Context,
  input: CancelReservationByStaffInput
): Promise<Reservation>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 予約を検索
3. ステータスチェック（cancelled, no-showはキャンセル不可）
4. Reservationエンティティの更新（status: cancelled、理由を記録）
5. データベースに保存
6. キャンセル通知メールの送信

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 予約が見つからない
- `BusinessRuleError`: ステータス不正

### 7. confirmArrival

来院を確認する（スタッフのみ）。

```typescript
export type ConfirmArrivalInput = {
  reservationId: string;
};

export async function confirmArrival(
  context: Context,
  input: ConfirmArrivalInput
): Promise<Reservation>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 予約を検索
3. ステータスチェック（confirmed のみ来院確認可能）
4. Reservationエンティティの更新（status: arrived、来院時刻を記録）
5. データベースに保存

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 予約が見つからない
- `BusinessRuleError`: ステータス不正

### 8. markAsNoShow

No-showとしてマークする（スタッフのみ）。

```typescript
export type MarkAsNoShowInput = {
  reservationId: string;
  reason?: string;
};

export async function markAsNoShow(
  context: Context,
  input: MarkAsNoShowInput
): Promise<Reservation>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 予約を検索
3. ステータスチェック（confirmed のみNo-show可能）
4. Reservationエンティティの更新（status: no-show、理由を記録）
5. データベースに保存

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 予約が見つからない
- `BusinessRuleError`: ステータス不正

### 9. getReservation

予約詳細を取得する。

```typescript
export type GetReservationInput = {
  reservationId: string;
};

export async function getReservation(
  context: Context,
  input: GetReservationInput
): Promise<Reservation>;
```

**処理フロー**:
1. 予約を検索
2. 権限チェック（自分の予約またはスタッフ）
3. 予約情報を返却

**エラー**:
- `NotFoundError`: 予約が見つからない
- `ForbiddenError`: 権限なし

### 10. getReservationsByCustomer

顧客の予約一覧を取得する。

```typescript
export type GetReservationsByCustomerInput = {
  customerId: string;
  status?: ReservationStatus[];
};

export async function getReservationsByCustomer(
  context: Context,
  input: GetReservationsByCustomerInput
): Promise<Reservation[]>;
```

**処理フロー**:
1. 権限チェック（自分の予約またはスタッフ）
2. 予約一覧を検索
3. ステータスでフィルタリング（オプション）
4. 結果を返却

**エラー**:
- `ForbiddenError`: 権限なし

### 11. getReservationsByDateRange

日付範囲で予約一覧を取得する（スタッフのみ）。

```typescript
export type GetReservationsByDateRangeInput = {
  startDate: Date;
  endDate: Date;
  staffId?: string;
};

export async function getReservationsByDateRange(
  context: Context,
  input: GetReservationsByDateRangeInput
): Promise<Reservation[]>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 予約一覧を検索
3. スタッフでフィルタリング（オプション）
4. 結果を返却

**エラー**:
- `ForbiddenError`: スタッフ権限なし

### 12. getAvailableTimeSlots

予約可能な時間枠を取得する。

```typescript
export type GetAvailableTimeSlotsInput = {
  date: Date;
  menuId: string;
  staffId?: string;
};

export async function getAvailableTimeSlots(
  context: Context,
  input: GetAvailableTimeSlotsInput
): Promise<TimeSlot[]>;
```

**処理フロー**:
1. メニュー情報を取得
2. スタッフ情報を取得（指定がある場合）
3. 予約制約を取得
4. 営業時間を取得
5. スタッフの勤務時間を取得（指定がある場合）
6. 臨時休業日をチェック
7. 時間枠を計算:
   - 営業時間内
   - スタッフ勤務時間内（指定がある場合）
   - 臨時休業日を除外
   - 予約受付期限を考慮
8. 各時間枠の予約数をカウント
9. 利用可能な時間枠のリストを返却

**エラー**:
- `NotFoundError`: メニューまたはスタッフが見つからない

### 13. checkReservationConflict

予約の競合をチェックする（内部ユースケース）。

```typescript
export type CheckReservationConflictInput = {
  customerId: string;
  startTime: Date;
  endTime: Date;
  excludeReservationId?: string;
};

export async function checkReservationConflict(
  context: Context,
  input: CheckReservationConflictInput
): Promise<boolean>;
```

**処理フロー**:
1. 顧客の重複予約を検索
2. 除外する予約ID がある場合は除外
3. 競合があれば true を返却

## 補足

### トランザクション管理

予約の作成・更新・キャンセルは、データベーストランザクション内で実行する必要があります。特に、予約枠の空き状況チェックと予約の保存は、同一トランザクション内で行い、競合を防ぐ必要があります。

### 楽観的ロック vs 悲観的ロック

重複予約を防ぐために、以下のアプローチが考えられます:

1. **楽観的ロック**: バージョン番号を使用し、更新時に競合を検出
2. **悲観的ロック**: データベースレベルでロックを取得
3. **セマフォ/分散ロック**: 複数インスタンスでの競合を防ぐ

実装時には、システムの負荷やスケーラビリティを考慮して選択します。

### リマインドメール

リマインドメールの送信は、Notificationドメインまたはバッチジョブで実装します。予約設定の「リマインドメール送信タイミング」に基づいて、該当する予約を検索し、メールを送信します。

### No-show率の追跡

顧客のNo-show履歴を追跡することで、将来的にNo-show率が高い顧客に対して特別な対応を行うことができます。この情報はCustomerドメインまたは分析ドメインで管理します。

### 拡張性

- 将来的なオンライン決済機能の追加
- キャンセル待ちリスト機能
- 定期予約機能（毎週同じ曜日・時間に予約）
- 予約の優先度管理（VIP顧客など）
