# acceptInvitation — 招待を承認する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 承認待ちの有効な招待が存在する | acceptInvitation を実行する | 招待が承認され、memberId, tenantId, role が返却される | 未実装 |
| 承認待ちの有効な招待が存在する | acceptInvitation を実行する | テナントに新しいメンバーが追加される | 未実装 |
| 招待の有効期限が切れている | acceptInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に承認済みである | acceptInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に辞退済みである | acceptInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に取り消し済みである | acceptInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のロールが staff である | acceptInvitation を実行する | StaffProfile が自動作成される | 未実装 |
| 招待のロールが admin である | acceptInvitation を実行する | StaffProfile は作成されない | 未実装 |
| 招待が正常に承認された | — | 招待者に承認通知が送信される | 未実装 |
| 存在しない invitationId が指定されている | acceptInvitation を実行する | NotFoundError がスローされる | 未実装 |
| 招待の email と異なる authUserId のメンバーが承認しようとする | acceptInvitation を実行する | ForbiddenError がスローされる | 未実装 |
