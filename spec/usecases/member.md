# Member ユースケース

## createMemberAccount — テナントメンバーアカウントを作成する

### 概要

認証基盤でのユーザー登録完了後に、テナントメンバーのベースアカウント情報を作成する。テナントへの所属とは独立。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 認証基盤のユーザーID |
| name | string | ✓ | 氏名 |
| email | string | ✓ | メールアドレス |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| authUserId | string | 認証ユーザーID |
| name | string | 氏名 |
| email | string | メールアドレス |

### テストケース

- 正常にアカウントを作成できる
- 同じ authUserId で重複作成しようとするとエラー

---

## updateMemberProfile — メンバープロフィールを更新する

### 概要

テナントメンバーが自身のプロフィールを更新する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| memberId | string | ✓ | メンバーID |
| name | string | ✓ | 氏名 |
| phoneNumber | string \| null | | 電話番号 |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | メンバーID |
| name | string | 氏名 |
| phoneNumber | string \| null | 電話番号 |

### テストケース

- 正常にプロフィールを更新できる
- 存在しないメンバーIDの場合 NotFoundError

---

## changeMemberRole — メンバーのロールを変更する

### 概要

管理者がテナント内のメンバーのロールを変更する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| targetMemberId | string | ✓ | 対象メンバーID |
| newRole | string | ✓ | 新しいロール（admin / staff） |

### 出力DTO

なし

### テストケース

- 正常にロールを変更できる
- 自分自身のロールは変更不可（ForbiddenError）
- 唯一の管理者をスタッフに変更しようとした場合 ConflictError
- admin→staff に変更した場合、StaffProfile が自動作成される
- staff→admin に変更した場合、StaffProfile は保持される

---

## removeMember — メンバーを削除する

### 概要

管理者がテナントからメンバーを除名する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| targetMemberId | string | ✓ | 対象メンバーID |

### 出力DTO

なし

### テストケース

- 正常にメンバーを削除できる
- 自分自身は削除不可（ForbiddenError）
- 唯一の管理者は削除不可（ConflictError）
- 削除されたメンバーに通知が送信される
- 担当予約は「担当者未定」になる

---

## listMembers — メンバー一覧を取得する

### 概要

テナント内のメンバー一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| role | string \| null | | ロールフィルター |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | MemberSummary[] | メンバー一覧 |

### テストケース

- メンバー一覧を取得できる
- ロールで絞り込みできる

---

## createInvitation — 招待を送信する

### 概要

管理者がテナントへの参加招待を送信する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |
| invitedByMemberId | string | ✓ | 招待者メンバーID |
| email | string | ✓ | 招待先メールアドレス |
| role | string | ✓ | 割り当てるロール |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 招待ID |

### テストケース

- 正常に招待を送信できる
- 既にメンバーのメールアドレスの場合 ConflictError
- 同じメールアドレスへの承認待ち招待が既にある場合 ConflictError
- 招待メールが送信される
- 有効期限が7日後に設定される

---

## listInvitations — 招待一覧を取得する

### 概要

テナントの招待一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| tenantId | string | ✓ | テナントID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | InvitationSummary[] | 招待一覧 |

### テストケース

- 招待一覧を取得できる
- 期限切れの招待も含まれる

---

## acceptInvitation — 招待を承認する

### 概要

テナントメンバーが招待を承認してテナントに参加する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| invitationId | string | ✓ | 招待ID |
| authUserId | string | ✓ | 承認者の認証ユーザーID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| memberId | string | 作成されたメンバーID |
| tenantId | string | テナントID |
| role | string | ロール |

### テストケース

- 正常に招待を承認しメンバーとして参加できる
- 期限切れの招待の場合 ConflictError
- 既に承認/辞退済みの招待の場合 ConflictError
- スタッフロールの場合 StaffProfile が自動作成される
- 招待者に承認通知が送信される

---

## declineInvitation — 招待を辞退する

### 概要

テナントメンバーが招待を辞退する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| invitationId | string | ✓ | 招待ID |
| authUserId | string | ✓ | 辞退者の認証ユーザーID |

### 出力DTO

なし

### テストケース

- 正常に招待を辞退できる
- 期限切れの招待の場合 ConflictError
- 招待者に辞退通知が送信される

---

## cancelInvitation — 招待を取り消す

### 概要

管理者が送信した招待を取り消す。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| invitationId | string | ✓ | 招待ID |

### 出力DTO

なし

### テストケース

- 正常に招待を取り消せる
- 承認待ち以外のステータスの場合 ConflictError

---

## resendInvitation — 招待を再送信する

### 概要

期限切れまたは承認待ちの招待を再送信する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| invitationId | string | ✓ | 招待ID |

### 出力DTO

なし

### テストケース

- 正常に招待を再送信できる
- 有効期限が新たに7日後にリセットされる
- 招待メールが再送信される

---

## deleteMemberAccount — テナントメンバーアカウントを削除する

### 概要

テナントメンバーが自身のアカウントを削除する。すべてのテナントから脱退する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 認証ユーザーID |

### 出力DTO

なし

### テストケース

- 正常にアカウントを削除できる
- いずれかのテナントで唯一の管理者の場合 ConflictError
- 全テナントから脱退される
- 担当予約は「担当者未定」になる

---

## listMemberTenants — 所属テナント一覧を取得する

### 概要

ログイン中のメンバーが所属するテナントの一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 認証ユーザーID |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | TenantWithRole[] | テナント名とロールの一覧 |

### テストケース

- 所属テナント一覧を取得できる
- 未所属の場合は空配列

---

## listPendingInvitations — 受け取った招待一覧を取得する

### 概要

メンバーが受け取った未対応の招待一覧を取得する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| email | string | ✓ | メンバーのメールアドレス |

### 出力DTO

| フィールド | 型 | 説明 |
|---|---|---|
| items | PendingInvitation[] | 未対応招待一覧 |

### テストケース

- 未対応の招待一覧を取得できる
- 期限切れの招待は含まれない
