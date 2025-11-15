# 要件定義

## 1. システム概要

予約管理システムは、整骨院等の店舗における予約業務をオンライン化するWebアプリケーション。顧客は予約の作成・変更・キャンセルを行い、店舗スタッフは予約状況の確認や顧客情報の管理を行う。

### 1.1 技術スタック

- **実行環境**: ブラウザ（クライアントサイドのみ）
- **アーキテクチャ**: Hexagonal Architecture + Domain-Driven Design
- **フレームワーク**: React Router v7 (Framework mode)
- **データベース**: Turso (SQLite互換) with Drizzle ORM
- **認証**: Email/パスワード + SSO (Google, LINE等)
- **UI**: Tailwind CSS, shadcn/ui, Tiptap

### 1.2 制約事項

- サーバーサイドの処理は使用不可（ブラウザAPIのみ使用）
- データベースはクライアントサイドからアクセス
- Node.js APIは使用不可

## 2. ドメインモデル

### 2.1 エンティティ

#### Customer (顧客)
```typescript
{
  id: string (UUID)
  email: string
  emailVerified: boolean
  passwordHash: string | null  // SSO利用時はnull
  authProvider: 'email' | 'google' | 'line' | ...
  authProviderId: string | null  // SSO利用時のプロバイダー側ID
  name: string
  nameKana: string
  phoneNumber: string
  isAthlete: boolean
  athleteInfo: {
    sport: string
    team: string
  } | null
  address: string | null  // 初回来院後に入力
  medicalHistory: string | null  // 初回来院後に入力（問診情報）
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime | null  // ソフトデリート
}
```

#### Staff (スタッフ)
```typescript
{
  id: string (UUID)
  email: string
  passwordHash: string
  name: string
  imageUrl: string | null
  role: 'admin' | 'staff'
  staffType: 'full_time' | 'part_time'
  defaultWorkingHours: {  // 常勤スタッフのデフォルト勤務時間
    startTime: Time  // HH:mm
    endTime: Time    // HH:mm
  } | null
  assignedMenuIds: string[]  // 担当可能なメニューID
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Menu (メニュー)
```typescript
{
  id: string (UUID)
  name: string
  description: string
  imageUrl: string | null
  price: number | null  // 自費の場合のみ、保険適用の場合はnull
  insuranceType: 'self_pay' | 'insurance_covered'
  displayOrder: number
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Reservation (予約)
```typescript
{
  id: string (UUID)
  customerId: string
  menuId: string
  staffId: string | null  // スタッフ選択が無効の場合はnull
  startTime: DateTime
  endTime: DateTime
  status: 'reserved' | 'visited' | 'cancelled' | 'no_show'
  cancellationReason: string | null  // 管理者キャンセル時の理由
  visitedAt: DateTime | null  // 来院確認時刻
  noShowReason: string | null  // No-show理由
  createdAt: DateTime
  updatedAt: DateTime
  cancelledAt: DateTime | null
}
```

#### Shop (店舗)
```typescript
{
  id: string (UUID)
  name: string
  address: string
  phoneNumber: string
  otherInfo: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### BusinessHour (営業時間)
```typescript
{
  id: string (UUID)
  shopId: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0=日曜, 6=土曜
  startTime: Time  // HH:mm
  endTime: Time    // HH:mm
  isHoliday: boolean  // 定休日フラグ
  displayOrder: number  // 同じ曜日に複数枠がある場合の順序
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### SpecialBusinessHour (臨時営業時間・休業)
```typescript
{
  id: string (UUID)
  shopId: string
  date: Date  // YYYY-MM-DD
  startTime: Time | null  // HH:mm、休業日の場合はnull
  endTime: Time | null    // HH:mm、休業日の場合はnull
  isHoliday: boolean  // 臨時休業フラグ
  reason: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### StaffShift (スタッフシフト)
```typescript
{
  id: string (UUID)
  staffId: string
  date: Date  // YYYY-MM-DD
  startTime: Time | null  // HH:mm、休みの場合はnull
  endTime: Time | null    // HH:mm、休みの場合はnull
  isAbsent: boolean  // 休みフラグ
  reason: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### ReservationSettings (予約設定)
```typescript
{
  id: string (UUID)
  shopId: string
  slotDurationMinutes: number  // 予約枠の時間間隔（分）
  maxReservationsPerSlot: number  // 1枠あたりの最大予約数
  acceptanceDays: number  // 予約受付期限（X日前まで）
  acceptanceTime: Time  // HH:mm、受付期限時刻
  cancellationDays: number  // キャンセル受付期限（X日前まで）
  cancellationTime: Time  // HH:mm
  modificationDays: number  // 変更受付期限（X日前まで）
  modificationTime: Time  // HH:mm
  reminderDays: number  // リマインド送信（X日前）
  reminderTime: Time  // HH:mm
  staffSelectionEnabled: boolean  // スタッフ選択の有効/無効
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### EmailVerificationToken (メールアドレス確認トークン)
```typescript
{
  id: string (UUID)
  customerId: string
  email: string  // 確認対象のメールアドレス
  token: string  // ランダム生成トークン
  expiresAt: DateTime
  verifiedAt: DateTime | null
  createdAt: DateTime
}
```

#### PasswordResetToken (パスワードリセットトークン)
```typescript
{
  id: string (UUID)
  customerId: string | null  // 顧客用
  staffId: string | null     // スタッフ用
  token: string
  expiresAt: DateTime
  usedAt: DateTime | null
  createdAt: DateTime
}
```

#### StaffInvitation (スタッフ招待)
```typescript
{
  id: string (UUID)
  email: string
  role: 'admin' | 'staff'
  token: string
  expiresAt: DateTime
  acceptedAt: DateTime | null
  createdAt: DateTime
}
```

### 2.2 バリューオブジェクト

#### Time
```typescript
{
  hour: number    // 0-23
  minute: number  // 0-59
}
```

#### DateRange
```typescript
{
  startDate: Date
  endDate: Date
}
```

#### TimeSlot
```typescript
{
  startTime: DateTime
  endTime: DateTime
}
```

## 3. ビジネスルール

### 3.1 予約作成

#### 3.1.1 予約可能条件
- メニューが有効（`isActive = true`）であること
- スタッフ選択が有効な場合、選択されたスタッフが該当メニューを担当可能（`assignedMenuIds`に含まれる）であること
- 選択された日時が予約受付期限内であること
  - 現在時刻から `(acceptanceDays日前のacceptanceTime)` より前であること
  - 例: acceptanceDays=3, acceptanceTime=23:59の場合、予約日の3日前23:59まで受付
- 選択された日時が営業時間内であること
  - `BusinessHour` または `SpecialBusinessHour` で定義された営業時間内
  - 臨時休業（`SpecialBusinessHour.isHoliday = true`）でないこと
- スタッフ選択が有効な場合、選択されたスタッフが勤務している時間であること
  - `StaffShift` で休み（`isAbsent = true`）に設定されていないこと
  - 常勤スタッフの場合: デフォルト勤務時間 or シフト設定時間内
  - 非常勤スタッフの場合: シフト設定時間内のみ
- 選択された時間枠の予約数が上限に達していないこと
  - 同じ時間枠（`startTime`, `endTime`）の予約数 < `maxReservationsPerSlot`
  - スタッフ選択が有効な場合は、同じスタッフ・同じ時間枠の予約数で判定

#### 3.1.2 予約確定時の整合性チェック
- 予約確定時に再度、予約可能条件をチェック（楽観的ロック）
- 満席の場合は `ConflictError` をスロー

### 3.2 予約変更

#### 3.2.1 変更可能条件
- 予約ステータスが `reserved` であること（キャンセル済み・来院済み・No-showは変更不可）
- 現在時刻が変更受付期限内であること
  - 現在時刻 < `(予約日時 - modificationDays日 + modificationTime)`
- 新しい日時が予約作成の条件を満たすこと

#### 3.2.2 変更確定時の整合性チェック
- 変更確定時に再度、変更可能条件と新しい日時の予約可能条件をチェック
- 条件違反の場合は適切なエラーをスロー

### 3.3 予約キャンセル

#### 3.3.1 キャンセル可能条件（顧客側）
- 予約ステータスが `reserved` であること
- 現在時刻がキャンセル受付期限内であること
  - 現在時刻 < `(予約日時 - cancellationDays日 + cancellationTime)`

#### 3.3.2 キャンセル（管理者側）
- 管理者は常にキャンセル可能
- キャンセル理由の入力が必要

### 3.4 スタッフ・メニュー削除

#### 3.4.1 削除可能条件
- 該当スタッフ/メニューで `status = 'reserved'` の予約が存在しないこと
- 存在する場合は `ConflictError` をスロー

#### 3.4.2 削除処理
- `isActive = false` に設定（論理削除）
- 削除後は新規予約で選択不可

### 3.5 臨時休業設定

#### 3.5.1 設定可能条件
- 該当日時に `status = 'reserved'` の予約が存在しないこと
- 存在する場合は `ConflictError` をスロー

### 3.6 アカウント削除

#### 3.6.1 削除可能条件（顧客）
- `status = 'reserved'` の予約が存在しないこと
- 存在する場合は `ConflictError` をスロー

#### 3.6.2 削除処理
- `deletedAt` に現在時刻を設定（ソフトデリート）
- 過去の予約履歴は保持

### 3.7 メールアドレス確認

#### 3.7.1 確認条件
- トークンが有効期限内であること（`expiresAt > 現在時刻`）
- トークンが未使用であること（`verifiedAt = null`）

#### 3.7.2 確認処理
- `Customer.emailVerified = true` に設定
- `EmailVerificationToken.verifiedAt` に現在時刻を設定

### 3.8 パスワードリセット

#### 3.8.1 リセット条件
- トークンが有効期限内であること（`expiresAt > 現在時刻`）
- トークンが未使用であること（`usedAt = null`）

#### 3.8.2 リセット処理
- 新しいパスワードハッシュを設定
- `PasswordResetToken.usedAt` に現在時刻を設定

### 3.9 スタッフ招待

#### 3.9.1 受諾条件
- トークンが有効期限内であること（`expiresAt > 現在時刻`）
- トークンが未使用であること（`acceptedAt = null`）

#### 3.9.2 受諾処理
- 新しいスタッフアカウントを作成
- `StaffInvitation.acceptedAt` に現在時刻を設定

## 4. バリデーション

### 4.1 Customer

| フィールド | ルール |
|-----------|--------|
| email | 必須、RFC 5322準拠のEmail形式、最大254文字 |
| password | 必須（Email認証時）、最小8文字、最大72文字、英数字記号を含む |
| name | 必須、最小1文字、最大100文字 |
| nameKana | 必須、最小1文字、最大100文字、全角カタカナのみ |
| phoneNumber | 必須、10-11桁の数字、ハイフンなし |
| athleteInfo.sport | `isAthlete = true`の場合必須、最大50文字 |
| athleteInfo.team | `isAthlete = true`の場合必須、最大100文字 |
| address | 任意、最大200文字 |
| medicalHistory | 任意、最大5000文字 |

### 4.2 Staff

| フィールド | ルール |
|-----------|--------|
| email | 必須、RFC 5322準拠のEmail形式、最大254文字 |
| password | 必須、最小8文字、最大72文字 |
| name | 必須、最小1文字、最大100文字 |
| imageUrl | 任意、有効なURL形式、最大2048文字 |
| role | 必須、`admin` or `staff` |
| staffType | 必須、`full_time` or `part_time` |
| defaultWorkingHours | `staffType = 'full_time'`の場合必須 |
| assignedMenuIds | 必須、最低1つ以上 |

### 4.3 Menu

| フィールド | ルール |
|-----------|--------|
| name | 必須、最小1文字、最大100文字 |
| description | 必須、最小1文字、最大1000文字 |
| imageUrl | 任意、有効なURL形式、最大2048文字 |
| price | `insuranceType = 'self_pay'`の場合必須、0以上の整数 |
| insuranceType | 必須、`self_pay` or `insurance_covered` |
| displayOrder | 必須、0以上の整数 |

### 4.4 Reservation

| フィールド | ルール |
|-----------|--------|
| customerId | 必須、存在する顧客ID |
| menuId | 必須、存在する有効なメニューID |
| staffId | スタッフ選択有効時は必須、存在する有効なスタッフID |
| startTime | 必須、未来の日時、営業時間内 |
| endTime | 必須、startTimeより後、営業時間内 |
| status | 必須、`reserved` | `visited` | `cancelled` | `no_show` |

### 4.5 Shop

| フィールド | ルール |
|-----------|--------|
| name | 必須、最小1文字、最大100文字 |
| address | 必須、最小1文字、最大200文字 |
| phoneNumber | 必須、10-11桁の数字、ハイフンなし |
| otherInfo | 任意、最大2000文字 |

### 4.6 BusinessHour

| フィールド | ルール |
|-----------|--------|
| dayOfWeek | 必須、0-6の整数 |
| startTime | `isHoliday = false`の場合必須 |
| endTime | `isHoliday = false`の場合必須、startTimeより後 |
| displayOrder | 必須、0以上の整数 |

### 4.7 ReservationSettings

| フィールド | ルール |
|-----------|--------|
| slotDurationMinutes | 必須、15, 30, 60, 90, 120のいずれか |
| maxReservationsPerSlot | 必須、1以上の整数 |
| acceptanceDays | 必須、0以上の整数 |
| cancellationDays | 必須、0以上の整数 |
| modificationDays | 必須、0以上の整数 |
| reminderDays | 必須、0以上の整数 |

## 5. 状態遷移

### 5.1 予約ステータス

```
[予約作成]
    ↓
reserved (予約中)
    ↓
    ├─→ visited (来院) ← 来院確認
    ├─→ cancelled (キャンセル) ← キャンセル処理
    └─→ no_show (無断キャンセル) ← No-show処理
```

**遷移ルール:**
- `reserved` → `visited`: 管理者のみ、来院確認時
- `reserved` → `cancelled`: 顧客（期限内）または管理者（常時）
- `reserved` → `no_show`: 管理者のみ
- 他の状態からの遷移は不可（不可逆）

### 5.2 メールアドレス確認状態

```
[会員登録 or メールアドレス変更]
    ↓
Customer.emailVerified = false
    ↓
[確認メールのリンククリック]
    ↓
Customer.emailVerified = true
```

## 6. 権限管理

### 6.1 ロール定義

| ロール | 説明 |
|-------|------|
| customer | 顧客ユーザー |
| staff | 一般スタッフ |
| admin | 管理者スタッフ |

### 6.2 権限マトリクス

| 機能 | customer | staff | admin |
|-----|----------|-------|-------|
| **予約** |
| 予約作成（自分） | ○ | - | - |
| 予約作成（他人） | - | - | ○ |
| 予約閲覧（自分） | ○ | - | - |
| 予約閲覧（全件） | - | ○ | ○ |
| 予約変更（自分・期限内） | ○ | - | - |
| 予約変更（全件） | - | - | ○ |
| 予約キャンセル（自分・期限内） | ○ | - | - |
| 予約キャンセル（全件） | - | - | ○ |
| 来院確認 | - | ○ | ○ |
| No-show処理 | - | - | ○ |
| **顧客管理** |
| 顧客情報閲覧（自分） | ○ | - | - |
| 顧客情報閲覧（全件） | - | ○ | ○ |
| 顧客情報編集（自分） | ○ | - | - |
| 顧客情報編集（全件） | - | - | ○ |
| 顧客作成 | - | - | ○ |
| 初回問診入力 | - | ○ | ○ |
| アカウント削除（自分） | ○ | - | - |
| **店舗管理** |
| 店舗情報閲覧 | ○ | ○ | ○ |
| 店舗情報編集 | - | - | ○ |
| 営業時間編集 | - | - | ○ |
| 臨時休業設定 | - | - | ○ |
| **メニュー管理** |
| メニュー閲覧 | ○ | ○ | ○ |
| メニュー作成・編集・削除 | - | - | ○ |
| **スタッフ管理** |
| スタッフ閲覧（顧客向け） | ○ | - | - |
| スタッフ閲覧（全件） | - | ○ | ○ |
| スタッフ作成・編集・削除 | - | - | ○ |
| シフト管理 | - | - | ○ |
| **設定** |
| 予約設定編集 | - | - | ○ |
| スタッフアカウント発行 | - | - | ○ |

## 7. ユースケース

### 7.1 顧客側ユースケース

#### UC-C01: 予約作成（初回・Email認証）
**アクター**: 未登録顧客

**事前条件**: なし

**処理フロー**:
1. メニュー一覧から希望メニューを選択
2. スタッフ選択が有効な場合、スタッフを選択
3. カレンダーから日時を選択（予約可能な枠のみ表示）
4. ログイン画面で「Email/パスワードで登録」を選択
5. Email、パスワードを入力
6. 会員情報を入力（名前、カナ、電話番号、スポーツ情報）
7. 確認画面で内容を確認
8. 予約を確定
   - 整合性チェック実施
   - 予約レコード作成（`status = 'reserved'`）
   - 顧客レコード作成（`emailVerified = false`）
   - メール確認トークン生成
9. 予約確認メールを送信
10. メールアドレス確認メールを送信

**事後条件**:
- 予約が作成される
- 顧客アカウントが作成される（未確認状態）

**例外フロー**:
- E1: 予約確定時に満席 → `ConflictError`、別の日時を選択するよう促す
- E2: バリデーションエラー → `ValidationError`、該当フィールドにエラー表示

#### UC-C02: 予約作成（初回・SSO認証）
**アクター**: 未登録顧客

**処理フロー**: UC-C01とほぼ同じだが、ステップ4-5が以下に変わる
4. ログイン画面でSSOプロバイダーを選択
5. プロバイダーの認証フローを実行

**事後条件**: UC-C01と同じ（`authProvider`が異なる）

#### UC-C03: 予約作成（2回目以降）
**アクター**: 登録済み顧客

**事前条件**: ログイン済み

**処理フロー**:
1. メニュー一覧から希望メニューを選択
2. スタッフ選択が有効な場合、スタッフを選択
3. カレンダーから日時を選択
4. 確認画面で内容を確認（会員情報は表示のみ）
5. 予約を確定
6. 予約確認メールを送信

#### UC-C04: 予約一覧閲覧
**アクター**: 登録済み顧客

**事前条件**: ログイン済み

**処理フロー**:
1. マイページにアクセス
2. 予約一覧を表示
   - 有効な予約（`status = 'reserved'` かつ未来の日時）
   - 過去の予約（`status = 'visited'` or 過去の日時）
   - キャンセル済み（`status = 'cancelled' | 'no_show'`）
3. 予約詳細を確認

#### UC-C05: 予約変更
**アクター**: 登録済み顧客

**事前条件**:
- ログイン済み
- 変更対象の予約が存在
- 変更受付期限内

**処理フロー**:
1. 予約一覧から該当予約を選択
2. 変更ボタンをクリック（期限外の場合は無効化）
3. 新しいスタッフを選択（任意）
4. 新しい日時を選択
5. 確認画面で変更内容を確認
6. 変更を確定
   - 整合性チェック実施
   - 予約レコード更新
7. 変更通知メールを送信

**例外フロー**:
- E1: 変更確定時に満席 → `ConflictError`
- E2: 変更受付期限外 → `ForbiddenError`、電話連絡を促す

#### UC-C06: 予約キャンセル
**アクター**: 登録済み顧客

**事前条件**:
- ログイン済み
- キャンセル対象の予約が存在
- キャンセル受付期限内

**処理フロー**:
1. 予約一覧から該当予約を選択
2. キャンセルボタンをクリック（期限外の場合は無効化）
3. キャンセル確認ダイアログを表示
4. キャンセルを実行
   - 予約レコード更新（`status = 'cancelled'`, `cancelledAt`設定）
5. キャンセル通知メールを送信

**例外フロー**:
- E1: キャンセル受付期限外 → `ForbiddenError`、電話連絡を促す

#### UC-C07: 会員情報変更
**アクター**: 登録済み顧客

**事前条件**: ログイン済み

**処理フロー**:
1. マイページから会員情報編集画面にアクセス
2. 名前、カナ、電話番号、スポーツ情報を変更
3. 確認画面で変更内容を確認
4. 変更を確定
   - バリデーション実施
   - 顧客レコード更新

#### UC-C08: メールアドレス変更
**アクター**: 登録済み顧客

**事前条件**: ログイン済み

**処理フロー**:
1. マイページから会員情報編集画面にアクセス
2. 新しいメールアドレスを入力
3. 確認画面で変更内容を確認
4. 変更を確定
   - 顧客レコード更新（`email`更新、`emailVerified = false`）
   - メール確認トークン生成
5. 新しいメールアドレス宛に確認メールを送信
6. リンククリックで確認完了（UC-C10）

#### UC-C09: パスワードリセット
**アクター**: 顧客（未ログイン）

**事前条件**: Email認証で登録済み

**処理フロー**:
1. ログイン画面で「パスワードを忘れた」をクリック
2. 登録済みEmailアドレスを入力
3. パスワードリセットトークンを生成
4. パスワードリセット用リンクをメールで送信
5. リンクから新しいパスワードを設定
   - トークン検証
   - 新しいパスワードでハッシュ更新
6. 新しいパスワードでログイン

**例外フロー**:
- E1: トークン期限切れ → `ValidationError`、再発行を促す
- E2: 存在しないEmail → エラーを表示せず成功メッセージ（セキュリティ対策）

#### UC-C10: メールアドレス確認
**アクター**: 顧客

**事前条件**: メール確認トークンが発行済み

**処理フロー**:
1. メール内のリンクをクリック
2. トークンを検証
   - 有効期限チェック
   - 未使用チェック
3. 顧客レコード更新（`emailVerified = true`）
4. トークンレコード更新（`verifiedAt`設定）
5. 確認完了画面を表示

**例外フロー**:
- E1: トークン期限切れ → `ValidationError`、再送信を促す
- E2: トークン使用済み → `ValidationError`

#### UC-C11: アカウント削除
**アクター**: 登録済み顧客

**事前条件**:
- ログイン済み
- 有効な予約が存在しない

**処理フロー**:
1. マイページからアカウント設定画面にアクセス
2. アカウント削除ボタンをクリック
3. 確認ダイアログを表示
   - 有効な予約がある場合はエラー表示
   - 予約履歴が削除される旨を通知
4. 削除を確定
   - 顧客レコード更新（`deletedAt`設定）
5. ログアウト
6. 削除完了メールを送信

**例外フロー**:
- E1: 有効な予約が存在 → `ConflictError`、予約をキャンセルするよう促す

### 7.2 管理者側ユースケース

#### UC-A01: 店舗初期セットアップ
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. 管理画面にアクセス
2. 店舗情報を登録
   - 店舗名、住所、電話番号、その他情報
3. 営業時間を登録
   - 曜日ごとに営業時間を設定（複数枠対応）
   - 定休日を設定
4. 予約設定を登録
   - 予約枠の時間間隔
   - 1枠あたりの最大予約数
   - 各種期限とリマインドタイミング
   - スタッフ選択の有効/無効

#### UC-A02: メニュー管理
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー（作成）**:
1. メニュー管理画面にアクセス
2. 新規メニュー作成ボタンをクリック
3. メニュー情報を入力
   - 名前、概要、画像、料金、保険区分
4. バリデーション実施
5. メニューレコード作成（`isActive = true`）

**処理フロー（削除）**:
1. メニュー一覧から削除対象を選択
2. 削除ボタンをクリック
3. 既存予約チェック
   - `status = 'reserved'`の予約が存在する場合は警告
4. 削除を確定
   - メニューレコード更新（`isActive = false`）

**例外フロー**:
- E1: 既存予約が存在 → `ConflictError`

#### UC-A03: スタッフ管理
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー（作成）**:
1. スタッフ管理画面にアクセス
2. 新規スタッフ作成ボタンをクリック
3. スタッフ情報を入力
   - スタッフ名、画像、担当メニュー、スタッフタイプ、デフォルト勤務時間
4. バリデーション実施
5. スタッフレコード作成（`isActive = true`）

**処理フロー（削除）**: UC-A02と同様

#### UC-A04: シフト管理
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. スタッフ管理画面からシフト管理にアクセス
2. カレンダーから日付を選択
3. スタッフごとに勤務時間を設定
   - 常勤: 休む時間を設定（`isAbsent = true`）
   - 非常勤: 出勤する時間を設定
4. シフトレコード作成/更新

#### UC-A05: 臨時休業設定
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. 営業時間管理画面にアクセス
2. カレンダーから日付を選択
3. 既存予約チェック
   - `status = 'reserved'`の予約が存在する場合は警告
4. 休業設定を保存
   - SpecialBusinessHourレコード作成（`isHoliday = true`）

**例外フロー**:
- E1: 既存予約が存在 → `ConflictError`

#### UC-A06: 直接予約
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. カレンダー画面から日時を選択
2. 新規予約ボタンをクリック
3. 顧客を検索または新規作成
4. メニューを選択
5. スタッフを選択（任意）
6. 予約を確定
   - 整合性チェック実施
   - 予約レコード作成
7. 顧客に確認メールを送信（任意）

#### UC-A07: 予約編集
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. 予約一覧から該当予約を選択
2. 編集ボタンをクリック
3. 日時、メニュー、スタッフを変更
4. 変更を確定
   - 整合性チェック実施
   - 予約レコード更新
5. 顧客に変更通知メールを送信

#### UC-A08: 予約キャンセル
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. 予約一覧から該当予約を選択
2. キャンセルボタンをクリック
3. キャンセル理由を入力
4. キャンセルを実行
   - 予約レコード更新（`status = 'cancelled'`, `cancellationReason`設定）
5. 顧客にキャンセル通知メールを送信

#### UC-A09: 来院確認
**アクター**: スタッフまたは管理者

**事前条件**: ログイン済み

**処理フロー**:
1. カレンダー画面から該当予約を選択
2. 来院確認ボタンをクリック
3. 予約レコード更新（`status = 'visited'`, `visitedAt`設定）

#### UC-A10: No-show処理
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. カレンダー画面から該当予約を選択
2. No-showボタンをクリック
3. No-show理由を入力（任意）
4. 予約レコード更新（`status = 'no_show'`, `noShowReason`設定）

#### UC-A11: 顧客管理
**アクター**: スタッフまたは管理者

**事前条件**: ログイン済み

**処理フロー（検索・閲覧）**:
1. 顧客管理画面にアクセス
2. 顧客を検索（名前、カナ、Email、電話番号）
3. 顧客詳細を表示
   - 基本情報
   - 予約履歴
   - 来院履歴（`status = 'visited'`の予約）

**処理フロー（初回問診入力）**:
1. 顧客詳細画面から初回問診ボタンをクリック
2. タブレットで顧客に入力してもらう
   - 住所
   - 問診情報
3. 入力内容を確認
4. 顧客レコード更新（`address`, `medicalHistory`設定）

#### UC-A12: スタッフアカウント発行
**アクター**: 管理者

**事前条件**: ログイン済み

**処理フロー**:
1. スタッフアカウント管理画面にアクセス
2. 新規発行ボタンをクリック
3. Email、ロールを入力
4. 招待トークンを生成
5. StaffInvitationレコード作成
6. 招待メールを送信

**処理フロー（受諾）**:
1. メール内のリンクをクリック
2. トークンを検証
3. パスワードを設定
4. スタッフレコード作成
5. StaffInvitationレコード更新（`acceptedAt`設定）

## 8. 通知機能

### 8.1 メール種類

| メール種類 | 送信タイミング | 受信者 | 内容 |
|-----------|-------------|-------|------|
| 予約確認 | 予約作成時 | 顧客 | 予約詳細（日時、メニュー、スタッフ） |
| メールアドレス確認 | 会員登録時、メールアドレス変更時 | 顧客 | 確認リンク |
| 予約変更通知 | 予約変更時 | 顧客 | 変更後の予約詳細 |
| 予約キャンセル通知 | 予約キャンセル時 | 顧客 | キャンセル確認、理由（管理者キャンセルの場合） |
| リマインド | 予約日のN日前 | 顧客 | 予約詳細、アクセス情報 |
| パスワードリセット | パスワードリセット要求時 | 顧客/スタッフ | リセットリンク |
| スタッフ招待 | スタッフアカウント発行時 | スタッフ | 招待リンク |
| アカウント削除完了 | アカウント削除時 | 顧客 | 削除完了通知 |

### 8.2 メール送信仕様

- 送信失敗時は最大3回リトライ
- リトライ間隔: 1分、5分、15分
- 送信ログを記録（送信日時、受信者、種類、ステータス）

### 8.3 リマインドメール送信

- バッチ処理として実装
- 1日1回、`ReservationSettings.reminderTime`に実行
- 対象: `ReservationSettings.reminderDays`日後の予約（`status = 'reserved'`）

## 9. エラーハンドリング

### 9.1 エラー種類

#### BusinessRuleError
- **説明**: ビジネスルール違反
- **例**: スタッフが担当できないメニューの予約
- **HTTPステータス**: 400 Bad Request

#### NotFoundError
- **説明**: リソースが存在しない
- **例**: 存在しない予約IDの参照
- **HTTPステータス**: 404 Not Found

#### ConflictError
- **説明**: リソースの競合
- **例**: 満席、既存予約があるためメニュー削除不可
- **HTTPステータス**: 409 Conflict
- **エラーコード**:
  - `RESERVATION_SLOT_FULL`: 予約枠が満席
  - `MENU_HAS_RESERVATIONS`: メニューに既存予約あり
  - `STAFF_HAS_RESERVATIONS`: スタッフに既存予約あり
  - `SPECIAL_HOUR_HAS_RESERVATIONS`: 臨時休業設定対象に既存予約あり
  - `ACCOUNT_HAS_ACTIVE_RESERVATIONS`: アカウントに有効な予約あり

#### UnauthorizedError
- **説明**: 認証エラー
- **例**: ログインが必要、トークンが無効
- **HTTPステータス**: 401 Unauthorized

#### ForbiddenError
- **説明**: 権限エラー
- **例**: 他人の予約を編集、期限外のキャンセル
- **HTTPステータス**: 403 Forbidden
- **エラーコード**:
  - `CANCELLATION_DEADLINE_PASSED`: キャンセル期限超過
  - `MODIFICATION_DEADLINE_PASSED`: 変更期限超過
  - `INSUFFICIENT_PERMISSION`: 権限不足

#### ValidationError
- **説明**: 入力値の検証エラー
- **例**: Email形式が不正、必須項目が未入力
- **HTTPステータス**: 422 Unprocessable Entity
- **構造**:
```typescript
{
  code: 'VALIDATION_ERROR',
  message: string,
  fields: {
    [fieldName: string]: string[]  // エラーメッセージの配列
  }
}
```

#### SystemError
- **説明**: システムエラー
- **例**: データベース接続エラー、外部API呼び出しエラー
- **HTTPステータス**: 500 Internal Server Error
- **エラーコード**:
  - `DATABASE_ERROR`: データベースエラー
  - `EMAIL_SEND_ERROR`: メール送信エラー
  - `NETWORK_ERROR`: ネットワークエラー

### 9.2 エラーレスポンス形式

```typescript
{
  code: string,           // エラーコード
  message: string,        // エラーメッセージ
  details?: any,          // 詳細情報（オプション）
  timestamp: string,      // ISO 8601形式のタイムスタンプ
  path: string           // リクエストパス
}
```

## 10. 非機能要件

### 10.1 パフォーマンス

- カレンダー表示: 初期表示2秒以内
- 予約作成/変更/キャンセル: 3秒以内に完了
- 検索機能: 1秒以内に結果表示

### 10.2 セキュリティ

#### 認証
- Email/パスワード: bcryptでハッシュ化（コスト係数10）
- SSO: OAuth 2.0 / OpenID Connect準拠
- セッション: HTTPOnly、Secure、SameSite=Strict Cookie
- セッションタイムアウト: 30分（操作時に更新）

#### CSRF対策
- Double Submit Cookie パターン
- カスタムヘッダー検証

#### XSS対策
- 入力値のサニタイズ
- Content Security Policy (CSP) 設定

#### SQLインジェクション対策
- Drizzle ORMによるパラメータ化クエリ

#### その他
- パスワード要件: 最小8文字、英数字記号を含む
- パスワードリセットトークン有効期限: 1時間
- メール確認トークン有効期限: 24時間
- スタッフ招待トークン有効期限: 7日

### 10.3 可用性

- メール送信失敗時の自動リトライ（最大3回）
- エラーログの記録と監視
- データベースバックアップ（1日1回）

### 10.4 保守性

- Hexagonal Architecture + DDDによる疎結合な設計
- ドメイン層、アプリケーション層、インフラ層の明確な分離
- TypeScriptによる型安全性
- ユニットテスト、統合テストの実装

### 10.5 ブラウザ対応

- モダンブラウザ最新2バージョン
  - Google Chrome
  - Mozilla Firefox
  - Apple Safari
  - Microsoft Edge
- モバイルブラウザ対応（レスポンシブデザイン）
  - iOS Safari
  - Chrome for Android

### 10.6 データ保持

- 顧客データ: 削除されるまで永続保持（ソフトデリート）
- 予約データ: 永続保持（分析用）
- ログデータ: 90日間保持

## 11. 技術的制約

### 11.1 クライアントサイド制約

- Node.js APIは使用不可
- ファイルシステムアクセスはFile System Access APIのみ
- サーバーサイドレンダリング不可
- バックグラウンド処理は制限あり

### 11.2 データベース制約

- Turso (SQLite互換) 使用
- クライアントサイドからアクセス
- トランザクション処理に制限あり

### 11.3 外部サービス連携

- メール送信サービス: 要選定（SendGrid、AWS SES等）
- SSOプロバイダー: Google、LINE等
- 画像ストレージ: 要選定（Cloudinary、AWS S3等）
