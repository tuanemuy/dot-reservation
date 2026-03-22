# Staff ユースケース

## updateStaffProfile — スタッフプロフィールを更新する

### 概要

管理者またはスタッフ本人がスタッフプロフィールを更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| staffProfileId | string | ✓ | スタッフプロフィールID |
| displayName | string | ✓ | 表示名 |
| imageUrl | string \| null | | プロフィール画像URL |
| bio | string \| null | | 自己紹介文 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | スタッフプロフィールID |
| displayName | string | 表示名 |

### テストケース

- 正常にプロフィールを更新できる
- 存在しないIDの場合 NotFoundError
- 表示名が空文字の場合バリデーションエラー

---

## updateAssignedMenus — 担当メニューを設定する

### 概要

管理者がスタッフの担当メニューを設定する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| staffProfileId | string | ✓ | スタッフプロフィールID |
| menuIds | string[] | ✓ | 担当メニューIDリスト |

### 出力DTO

なし

### テストケース

- 正常に担当メニューを設定できる
- 0件（空配列）でも設定可能
- 存在しないメニューIDが含まれる場合 NotFoundError

---

## listStaffProfiles — スタッフ一覧を取得する

### 概要

テナントのスタッフ一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | StaffProfileSummary[] | スタッフ一覧 |

### テストケース

- スタッフ一覧を取得できる
- スタッフが0件の場合は空配列

---

## getStaffProfile — スタッフ詳細を取得する

### 概要

スタッフプロフィールの詳細を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| staffProfileId | string | ✓ | スタッフプロフィールID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | スタッフプロフィールID |
| displayName | string | 表示名 |
| imageUrl | string \| null | プロフィール画像URL |
| bio | string \| null | 自己紹介文 |
| assignedMenus | MenuSummary[] | 担当メニュー一覧 |

### テストケース

- スタッフ詳細を取得できる
- 存在しないIDの場合 NotFoundError

---

## getStaffProfileByMemberId — メンバーIDでスタッフ詳細を取得する

### 概要

メンバーIDからスタッフプロフィールを取得する（スタッフ本人のアクセス用）。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| memberId | string | ✓ | メンバーID |

### 出力DTO

getStaffProfile と同一

### テストケース

- メンバーIDでスタッフ詳細を取得できる
- スタッフプロフィールが存在しない場合 NotFoundError

---

## listStaffsByMenu — メニュー別スタッフ一覧を取得する

### 概要

指定メニューを担当できるスタッフ一覧を取得する（予約フロー用）。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| menuId | string | ✓ | メニューID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | StaffProfileSummary[] | スタッフ一覧 |

### テストケース

- 指定メニューを担当できるスタッフ一覧を取得できる
- 担当スタッフがいない場合は空配列
