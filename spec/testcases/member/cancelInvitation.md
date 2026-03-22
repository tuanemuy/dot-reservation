# cancelInvitation — 招待を取り消す

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 承認待ちの招待が存在する | cancelInvitation を実行する | 招待が正常に取り消される | 未実装 |
| 招待のステータスが承認済みである | cancelInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のステータスが辞退済みである | cancelInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のステータスが既に取り消し済みである | cancelInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のステータスが期限切れである | cancelInvitation を実行する | ConflictError がスローされる | 未実装 |
| 存在しない invitationId が指定されている | cancelInvitation を実行する | NotFoundError がスローされる | 未実装 |
