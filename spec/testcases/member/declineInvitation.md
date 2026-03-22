# declineInvitation — 招待を辞退する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 承認待ちの有効な招待が存在する | declineInvitation を実行する | 招待が正常に辞退される | 未実装 |
| 招待の有効期限が切れている | declineInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に承認済みである | declineInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に辞退済みである | declineInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が既に取り消し済みである | declineInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待が正常に辞退された | — | 招待者に辞退通知が送信される | 未実装 |
| 存在しない invitationId が指定されている | declineInvitation を実行する | NotFoundError がスローされる | 未実装 |
| 招待の email と異なる authUserId のメンバーが辞退しようとする | declineInvitation を実行する | ForbiddenError がスローされる | 未実装 |
