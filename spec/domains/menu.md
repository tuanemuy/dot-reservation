# Menu ドメイン

## 概要

Menuドメインは、施術メニューの管理を担当します。メニュー情報（名前、概要、料金、自費/保険区分）、メニュー画像、メニューの有効/無効管理、メニュー削除時の既存予約チェックを行います。

## エンティティ

### Menu

施術メニューを表すエンティティ。

```typescript
export type MenuBase = Readonly<{
  id: MenuId;
  name: MenuName;
  description: string;
  imageUrl: string | null;
  durationMinutes: number;
  billingType: BillingType;
  createdAt: Date;
  updatedAt: Date;
}>;

export type SelfPayMenu = MenuBase & {
  billingType: "self-pay";
  price: Price;
};

export type InsuranceCoveredMenu = MenuBase & {
  billingType: "insurance";
};

export type Menu = SelfPayMenu | InsuranceCoveredMenu;
```

**ビジネスルール**:
- メニュー名は必須で一意
- 所要時間は1分以上
- 自費診療の場合は料金が必須
- 保険適用の場合は料金なし
- 画像は任意

**状態**:
- メニューはアーカイブではなく、削除時に既存予約をチェック

## 値オブジェクト

### MenuId

```typescript
export type MenuId = string & { readonly brand: "MenuId" };

export function createMenuId(id: string): MenuId;
export function generateMenuId(): MenuId;
```

### MenuName

```typescript
export type MenuName = string & { readonly brand: "MenuName" };

export function createMenuName(name: string): MenuName;
```

**バリデーション**:
- 1文字以上、100文字以内
- 空白のみは不可

### Price

```typescript
export type Price = number & { readonly brand: "Price" };

export function createPrice(price: number): Price;
```

**バリデーション**:
- 0以上の整数
- 最大値: 1,000,000円

### BillingType

```typescript
export type BillingType = "self-pay" | "insurance";

export function createBillingType(type: string): BillingType;
```

## エラーコード

```typescript
export enum MenuErrorCode {
  // バリデーション
  InvalidMenuName = "INVALID_MENU_NAME",
  InvalidDuration = "INVALID_DURATION",
  InvalidPrice = "INVALID_PRICE",
  MenuNameAlreadyExists = "MENU_NAME_ALREADY_EXISTS",

  // 削除制約
  MenuHasActiveReservations = "MENU_HAS_ACTIVE_RESERVATIONS",

  // その他
  MenuNotFound = "MENU_NOT_FOUND",
}
```

## ポート

### MenuRepository

```typescript
export interface MenuRepository {
  save(menu: Menu): Promise<void>;
  findById(id: MenuId): Promise<Menu | null>;
  findByName(name: MenuName): Promise<Menu | null>;
  findAll(): Promise<Menu[]>;
  delete(id: MenuId): Promise<void>;
}
```

### ImageStorage

メニュー画像の保存・取得を行うポート。

```typescript
export interface ImageStorage {
  upload(file: File, path: string): Promise<string>;
  delete(url: string): Promise<void>;
  getPublicUrl(path: string): Promise<string>;
}
```

## ユースケース

### 1. createMenu

メニューを作成する（スタッフのみ）。

```typescript
export type CreateMenuInput = {
  name: string;
  description: string;
  image?: File;
  durationMinutes: number;
  billingType: string;
  price?: number;
};

export async function createMenu(
  context: Context,
  input: CreateMenuInput
): Promise<Menu>;
```

**処理フロー**:
1. スタッフ権限チェック
2. メニュー名の重複チェック
3. 値オブジェクトの作成（バリデーション）
4. 画像がある場合、アップロード
5. Menuエンティティの作成
6. データベースに保存

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `BusinessRuleError`: バリデーションエラー
- `ConflictError`: メニュー名重複
- `SystemError`: 画像アップロード失敗

### 2. updateMenu

メニューを更新する（スタッフのみ）。

```typescript
export type UpdateMenuInput = {
  menuId: string;
  name?: string;
  description?: string;
  image?: File;
  removeImage?: boolean;
  durationMinutes?: number;
  billingType?: string;
  price?: number;
};

export async function updateMenu(
  context: Context,
  input: UpdateMenuInput
): Promise<Menu>;
```

**処理フロー**:
1. スタッフ権限チェック
2. メニューを検索
3. メニュー名が変更される場合、重複チェック
4. 値オブジェクトの作成（バリデーション）
5. 画像が変更される場合:
   - 古い画像を削除
   - 新しい画像をアップロード
6. Menuエンティティの更新
7. データベースに保存

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: メニューが見つからない
- `BusinessRuleError`: バリデーションエラー
- `ConflictError`: メニュー名重複
- `SystemError`: 画像アップロード失敗

### 3. deleteMenu

メニューを削除する（スタッフのみ）。

```typescript
export type DeleteMenuInput = {
  menuId: string;
};

export async function deleteMenu(
  context: Context,
  input: DeleteMenuInput
): Promise<void>;
```

**処理フロー**:
1. スタッフ権限チェック
2. メニューを検索
3. 既存予約があるかチェック（有効な予約のみ）
4. 画像がある場合、削除
5. メニューを削除

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: メニューが見つからない
- `BusinessRuleError`: 既存予約がある

### 4. getMenu

メニュー詳細を取得する。

```typescript
export type GetMenuInput = {
  menuId: string;
};

export async function getMenu(
  context: Context,
  input: GetMenuInput
): Promise<Menu>;
```

**処理フロー**:
1. メニューを検索
2. メニュー情報を返却

**エラー**:
- `NotFoundError`: メニューが見つからない

### 5. listMenus

メニュー一覧を取得する。

```typescript
export async function listMenus(context: Context): Promise<Menu[]>;
```

**処理フロー**:
1. すべてのメニューを検索
2. メニュー一覧を返却

### 6. checkMenuHasActiveReservations

メニューに有効な予約があるかチェックする（内部ユースケース）。

```typescript
export type CheckMenuHasActiveReservationsInput = {
  menuId: string;
};

export async function checkMenuHasActiveReservations(
  context: Context,
  input: CheckMenuHasActiveReservationsInput
): Promise<boolean>;
```

**処理フロー**:
1. メニューIDで有効な予約を検索
2. 予約が存在すれば true を返却

## 補足

### 画像管理

メニュー画像は、以下のような保存方法が考えられます:

1. **File System Access API**: ブラウザ環境でローカルストレージを使用
2. **IndexedDB**: ブラウザ内のデータベースに保存
3. **外部ストレージ**: 将来的にクラウドストレージ（S3など）に対応

現在のアーキテクチャ（ブラウザベース）では、File System Access APIまたはIndexedDBを使用することが推奨されます。

### メニューの並び順

メニューの表示順序を管理するために、将来的に`displayOrder`フィールドを追加することが考えられます。ドラッグ&ドロップでメニューの順序を変更できるUIを提供できます。

### メニューのカテゴリ分け

将来的にメニューをカテゴリ分けする場合、`category`フィールドを追加するか、別のCategoryエンティティを作成することが考えられます。

### メニューのアーカイブ

削除の代わりに、メニューをアーカイブする機能を追加することも検討できます。アーカイブされたメニューは新規予約で選択できませんが、既存予約には影響しません。

### 拡張性

- メニューのバリエーション（時間違いの同じメニュー）
- メニューの組み合わせ（セットメニュー）
- 季節限定メニュー（有効期限設定）
- メニューごとのスタッフ制限（特定のスタッフのみ提供可能）
