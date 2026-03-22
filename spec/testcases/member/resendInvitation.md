# resendInvitation — 招待を再送信する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 承認待ちの招待が存在する | resendInvitation を実行する | 招待が正常に再送信される | 未実装 |
| 期限切れの招待が存在する | resendInvitation を実行する | 招待が正常に再送信される | 未実装 |
| 招待が再送信された | — | 有効期限が新たに7日後にリセットされる | 未実装 |
| 招待が再送信された | — | 招待メールが再送信される | 未実装 |
| 招待のステータスが承認済みである | resendInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のステータスが辞退済みである | resendInvitation を実行する | ConflictError がスローされる | 未実装 |
| 招待のステータスが取り消し済みである | resendInvitation を実行する | ConflictError がスローされる | 未実装 |
| 存在しない invitationId が指定されている | resendInvitation を実行する | NotFoundError がスローされる | 未実装 |
