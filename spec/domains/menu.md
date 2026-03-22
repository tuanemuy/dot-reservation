# Menu ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| メニュー（Menu） | テナントが顧客に提供するサービスメニュー |
| メニューカテゴリー（MenuCategory） | メニューの分類 |
| 所要時間（Duration） | メニューの施術にかかる時間 |
| 料金（Price） | メニューの料金 |
| 表示順（SortOrder） | 顧客向け表示の並び順 |

## エンティティ

### Menu（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | MenuId | メニューID |
| tenantId | TenantId | テナントID |
| name | MenuName | メニュー名 |
| category | MenuCategory \| null | カテゴリー |
| description | MenuDescription \| null | 説明文 |
| duration | MenuDuration | 所要時間（分） |
| price | MenuPrice | 料金 |
| sortOrder | number | 表示順 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Menu.create(params)` — メニューを作成する
- `Menu.update(menu, params)` — メニューを更新する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| MenuId | string (branded) | UUID形式 |
| MenuName | string (branded) | 1〜100文字 |
| MenuCategory | string (branded) | 1〜50文字 |
| MenuDescription | string (branded) | 最大2000文字 |
| MenuDuration | number (branded) | 15分以上、15分単位 |
| MenuPrice | number (branded) | 0以上の整数 |

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| menu.created | menuId, tenantId | メニュー作成時 |
| menu.deleted | menuId, tenantId | メニュー削除時 |

## ポート

### MenuRepository

- `save(menu: Menu): Promise<void>`
- `findById(id: MenuId): Promise<Menu | null>`
- `findByTenantId(tenantId: TenantId): Promise<Menu[]>`
- `existsByTenantIdAndName(tenantId: TenantId, name: MenuName): Promise<boolean>`
- `delete(id: MenuId): Promise<void>`
- `updateSortOrders(items: { id: MenuId; sortOrder: number }[]): Promise<void>`

## ユースケース（概要）

- メニューを作成する
- メニューを更新する
- メニューを削除する
- メニュー一覧を取得する
- メニューの並び順を変更する
