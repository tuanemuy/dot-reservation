# Tenant ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| テナント（Tenant） | 予約システムを利用する店舗。マルチテナントの単位 |
| URLパス（UrlPath） | テナントの公開URLに使用される一意の文字列 |
| カテゴリー（TenantCategory） | 店舗の業種（整体院、ジム、美容院等） |
| テナントステータス（TenantStatus） | テナントの状態（稼働中 / 停止中） |
| 営業時間（BusinessHours） | 曜日ごとの営業開始・終了時刻 |
| 定休日（RegularHoliday） | 毎週定期的に休業する曜日 |
| 臨時休業日（TemporaryHoliday） | 特定の日付の臨時休業 |
| 予約設定（ReservationSettings） | 予約に関する各種設定 |

## エンティティ

### Tenant（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | TenantId | テナントID |
| name | TenantName | テナント名（店舗名） |
| category | TenantCategory | カテゴリー |
| urlPath | TenantUrlPath | URLパス |
| postalCode | PostalCode | 郵便番号 |
| address | Address | 住所 |
| phoneNumber | PhoneNumber | 電話番号 |
| description | TenantDescription \| null | 店舗紹介文 |
| imageUrls | string[] | 店舗画像URL（最大10枚） |
| businessHours | BusinessHours | 営業時間設定 |
| regularHolidays | DayOfWeek[] | 定休日 |
| temporaryHolidays | TemporaryHoliday[] | 臨時休業日 |
| reservationSettings | ReservationSettings | 予約設定 |
| status | TenantStatus | テナントステータス |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Tenant.create(params)` — テナントを作成する
- `Tenant.updateProfile(tenant, params)` — 基本情報を更新する
- `Tenant.updateBusinessHours(tenant, businessHours)` — 営業時間を更新する
- `Tenant.updateRegularHolidays(tenant, holidays)` — 定休日を更新する
- `Tenant.addTemporaryHoliday(tenant, holiday)` — 臨時休業日を追加する
- `Tenant.removeTemporaryHoliday(tenant, date)` — 臨時休業日を削除する
- `Tenant.updateReservationSettings(tenant, settings)` — 予約設定を更新する
- `Tenant.suspend(tenant)` — テナントを停止する
- `Tenant.reactivate(tenant)` — テナントを再開する
- `Tenant.isOperatingOn(tenant, date)` — 指定日が営業日かを判定する
- `Tenant.getOperatingHoursOn(tenant, date)` — 指定日の営業時間を取得する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| TenantId | string (branded) | UUID形式 |
| TenantName | string (branded) | 1〜100文字 |
| TenantCategory | string (branded) | 1〜50文字 |
| TenantUrlPath | string (branded) | 小文字英数字・ハイフン、3〜50文字、一意 |
| TenantDescription | string (branded) | 最大5000文字 |
| TenantStatus | "active" \| "suspended" | — |
| PostalCode | string (branded) | 郵便番号形式 |
| Address | { prefecture, city, street } | 各フィールド必須 |
| DayOfWeek | 0〜6 | 0=日, 1=月, ... 6=土 |

### BusinessHours（値オブジェクト）

曜日ごとの営業時間を表す。

```
type DailyHours = { open: TimeOfDay; close: TimeOfDay } | null  // nullは休業
type BusinessHours = Record<DayOfWeek, DailyHours>
```

- TimeOfDay: 時刻（HH:MM形式、15分単位）

### TemporaryHoliday（値オブジェクト）

| フィールド | 型 | 説明 |
|---|---|---|
| date | Date | 臨時休業日の日付 |
| reason | string \| null | 理由（任意） |

### ReservationSettings（値オブジェクト）

| フィールド | 型 | 説明 |
|---|---|---|
| bookingWindowDays | number | 予約受付期間（日数） |
| bookingDeadlineHours | number | 予約受付締切（時間前） |
| cancellationDeadlineHours | number | キャンセル期限（時間前） |
| slotDurationMinutes | number | 予約枠の時間単位（分） |
| bufferMinutes | number | 予約間のバッファ時間（分） |
| approvalMethod | "auto" \| "manual" | 予約承認方法 |

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| tenant.created | tenantId | テナント作成時 |
| tenant.suspended | tenantId | テナント停止時 |
| tenant.reactivated | tenantId | テナント再開時 |
| tenant.deleted | tenantId | テナント削除時 |

## ポート

### TenantRepository

- `save(tenant: Tenant): Promise<void>`
- `findById(id: TenantId): Promise<Tenant | null>`
- `findByUrlPath(urlPath: TenantUrlPath): Promise<Tenant | null>`
- `findAll(filter, pagination): Promise<PaginationResult<Tenant>>`
- `delete(id: TenantId): Promise<void>`
- `existsByUrlPath(urlPath: TenantUrlPath): Promise<boolean>`

### StorageManager

- `uploadImage(file: File): Promise<string>` — 画像をアップロードしURLを返す
- `deleteImage(url: string): Promise<void>` — 画像を削除する

## ユースケース（概要）

- テナントを作成する
- テナント情報を更新する
- 営業設定を更新する（営業時間、定休日、臨時休業日）
- 予約設定を更新する
- テナントを削除する
- テナント情報を取得する
- テナントを公開URLパスで取得する
- テナントを停止する（プラットフォーム管理者）
- テナントを再開する（プラットフォーム管理者）
- テナント一覧を取得する（プラットフォーム管理者）
- 店舗を検索する（顧客向け）
