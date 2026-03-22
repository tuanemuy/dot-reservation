# Staff ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| スタッフプロフィール（StaffProfile） | 顧客向けに公開されるスタッフ情報。テナントメンバーアカウントとは別の情報体系 |
| 担当メニュー（AssignedMenu） | スタッフが担当できるメニューの割り当て |

## エンティティ

### StaffProfile（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | StaffProfileId | スタッフプロフィールID |
| tenantId | TenantId | テナントID |
| memberId | MemberId | 紐づくメンバーID |
| displayName | StaffDisplayName | 表示名（顧客向け） |
| imageUrl | string \| null | プロフィール画像URL |
| bio | StaffBio \| null | 自己紹介文 |
| assignedMenuIds | MenuId[] | 担当メニューIDリスト |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `StaffProfile.create(params)` — スタッフプロフィールを作成する（`member.joined` イベントのハンドラーとして、スタッフロールの場合に自動作成）
- `StaffProfile.updateProfile(staffProfile, params)` — プロフィールを更新する
- `StaffProfile.updateAssignedMenus(staffProfile, menuIds)` — 担当メニューを更新する
- `StaffProfile.canHandleMenu(staffProfile, menuId)` — 指定メニューを担当できるかを判定する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| StaffProfileId | string (branded) | UUID形式 |
| StaffDisplayName | string (branded) | 1〜50文字 |
| StaffBio | string (branded) | 最大1000文字 |

## ポート

### StaffProfileRepository

- `save(staffProfile: StaffProfile): Promise<void>`
- `findById(id: StaffProfileId): Promise<StaffProfile | null>`
- `findByMemberId(memberId: MemberId): Promise<StaffProfile | null>`
- `findByTenantId(tenantId: TenantId): Promise<StaffProfile[]>`
- `findByTenantIdAndMenuId(tenantId: TenantId, menuId: MenuId): Promise<StaffProfile[]>`
- `delete(id: StaffProfileId): Promise<void>`

### StorageManager

- `uploadImage(file: File): Promise<string>`
- `deleteImage(url: string): Promise<void>`

## ユースケース（概要）

- スタッフプロフィールを更新する（管理者 or スタッフ本人）
- 担当メニューを設定する（管理者）
- スタッフ一覧を取得する
- スタッフ詳細を取得する
- 担当メニューを確認する（スタッフ本人）
