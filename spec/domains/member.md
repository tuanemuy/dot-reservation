# Member ドメイン

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| テナントメンバー（Member） | テナントに所属するユーザー。管理者またはスタッフロールを持つ |
| メンバーロール（MemberRole） | テナント内での権限（管理者 / スタッフ） |
| 招待（Invitation） | テナントへの参加招待 |
| 招待ステータス（InvitationStatus） | 招待の状態（承認待ち / 承認済み / 辞退 / 期限切れ） |

## エンティティ

### Member（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | MemberId | メンバーID |
| tenantId | TenantId | 所属テナントID |
| authUserId | string | 認証基盤でのユーザーID |
| name | MemberName | 氏名 |
| email | Email | メールアドレス |
| phoneNumber | PhoneNumber \| null | 電話番号（任意） |
| role | MemberRole | ロール |
| joinedAt | Date | 参加日時 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Member.create(params)` — メンバーを作成する（招待承認時）
- `Member.updateProfile(member, params)` — プロフィールを更新する
- `Member.changeRole(member, newRole)` — ロールを変更する
- `Member.isAdmin(member)` — 管理者かを判定する
- `Member.isStaff(member)` — スタッフかを判定する

### Invitation（集約ルート）

| フィールド | 型 | 説明 |
|---|---|---|
| id | InvitationId | 招待ID |
| tenantId | TenantId | テナントID |
| email | Email | 招待先メールアドレス |
| role | MemberRole | 割り当てるロール |
| invitedBy | MemberId | 招待した管理者のメンバーID |
| status | InvitationStatus | ステータス |
| expiresAt | Date | 有効期限 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 振る舞い

- `Invitation.create(params)` — 招待を作成する
- `Invitation.accept(invitation)` — 招待を承認する
- `Invitation.decline(invitation)` — 招待を辞退する
- `Invitation.cancel(invitation)` — 招待を取り消す
- `Invitation.isExpired(invitation)` — 期限切れかを判定する
- `Invitation.isPending(invitation)` — 承認待ちかを判定する

## 値オブジェクト

| 値オブジェクト | 基底型 | バリデーション |
|---|---|---|
| MemberId | string (branded) | UUID形式 |
| MemberName | string (branded) | 1〜50文字 |
| MemberRole | "admin" \| "staff" | — |
| InvitationId | string (branded) | UUID形式 |
| InvitationStatus | "pending" \| "accepted" \| "declined" \| "expired" | — |

## ドメインサービス

### MemberPolicyService

テナント内のメンバーに関するビジネスルールを検証する。

- `canRemoveMember(tenantId, targetMemberId)` — メンバーを削除できるか（唯一の管理者でないこと）
- `canChangeRole(tenantId, targetMemberId, newRole)` — ロールを変更できるか
- `canDeleteAccount(authUserId)` — アカウントを削除できるか（唯一の管理者のテナントがないこと）

## ドメインイベント

| イベント | ペイロード | 発生タイミング |
|---|---|---|
| member.joined | memberId, tenantId, role | メンバー参加時 |
| member.removed | memberId, tenantId | メンバー削除時 |
| member.roleChanged | memberId, tenantId, oldRole, newRole | ロール変更時 |
| invitation.created | invitationId, tenantId, email | 招待作成時 |
| invitation.accepted | invitationId, tenantId | 招待承認時 |
| invitation.declined | invitationId, tenantId | 招待辞退時 |

## ポート

### MemberRepository

- `save(member: Member): Promise<void>`
- `findById(id: MemberId): Promise<Member | null>`
- `findByTenantId(tenantId: TenantId, pagination): Promise<PaginationResult<Member>>`
- `findByAuthUserId(authUserId: string): Promise<Member[]>`
- `findByTenantIdAndAuthUserId(tenantId: TenantId, authUserId: string): Promise<Member | null>`
- `countAdminsByTenantId(tenantId: TenantId): Promise<number>`
- `delete(id: MemberId): Promise<void>`

### InvitationRepository

- `save(invitation: Invitation): Promise<void>`
- `findById(id: InvitationId): Promise<Invitation | null>`
- `findByTenantId(tenantId: TenantId): Promise<Invitation[]>`
- `findPendingByEmail(email: Email): Promise<Invitation[]>`
- `delete(id: InvitationId): Promise<void>`

### EmailSender

- `sendInvitationEmail(email: Email, invitation: Invitation, tenantName: string): Promise<void>`

## ユースケース（概要）

- テナントメンバーアカウントを作成する
- メンバープロフィールを更新する
- メンバーのロールを変更する
- メンバーを削除する
- メンバー一覧を取得する
- 招待を送信する
- 招待一覧を取得する
- 招待を承認する
- 招待を辞退する
- 招待を取り消す
- 招待を再送信する
- テナントメンバーアカウントを削除する
- 所属テナント一覧を取得する
