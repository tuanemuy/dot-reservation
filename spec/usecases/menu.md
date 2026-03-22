# Menu ユースケース

## createMenu — メニューを作成する

### 概要

管理者がテナントに新しいメニューを登録する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| name | string | ✓ | メニュー名 |
| category | string \| null | | カテゴリー |
| description | string \| null | | 説明文 |
| duration | number | ✓ | 所要時間（分） |
| price | number | ✓ | 料金 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | メニューID |
| name | string | メニュー名 |

### テストケース

- 正常にメニューを作成できる
- 同一テナント内でメニュー名が重複する場合 ConflictError
- 所要時間が15分未満の場合バリデーションエラー
- 表示順は末尾に追加される

---

## updateMenu — メニューを更新する

### 概要

管理者がメニュー情報を更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| menuId | string | ✓ | メニューID |
| name | string | ✓ | メニュー名 |
| category | string \| null | | カテゴリー |
| description | string \| null | | 説明文 |
| duration | number | ✓ | 所要時間（分） |
| price | number | ✓ | 料金 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | メニューID |
| name | string | メニュー名 |

### テストケース

- 正常にメニューを更新できる
- メニュー名を他の既存メニューと同じにした場合 ConflictError
- 存在しないメニューIDの場合 NotFoundError

---

## deleteMenu — メニューを削除する

### 概要

管理者がメニューを削除する。既存の予約には影響しない。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| menuId | string | ✓ | メニューID |

### 出力DTO

なし

### テストケース

- 正常にメニューを削除できる
- 存在しないメニューIDの場合 NotFoundError

---

## listMenus — メニュー一覧を取得する

### 概要

テナントのメニュー一覧を表示順で取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | MenuDetail[] | メニュー一覧（表示順） |

### テストケース

- メニュー一覧を表示順で取得できる
- メニューが0件の場合は空配列

---

## updateMenuSortOrders — メニューの並び順を変更する

### 概要

管理者がメニューの表示順を変更する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| items | { menuId: string, sortOrder: number }[] | ✓ | メニューIDと新しい表示順のペア |

### 出力DTO

なし

### テストケース

- 正常に並び順を変更できる
