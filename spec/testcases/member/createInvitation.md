# createInvitation — 招待を送信する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な tenantId, invitedByMemberId, email, role が提供されている | createInvitation を実行する | 招待が正常に作成され、招待IDが返却される | 未実装 |
| 招待が正常に作成された | — | 招待メールが送信される | 未実装 |
| 招待が正常に作成された | — | 有効期限が7日後に設定される | 未実装 |
| 指定した email のメンバーが既にテナントに所属している | createInvitation を実行する | ConflictError がスローされる | 未実装 |
| 同じ email への承認待ち招待が既に存在する | createInvitation を実行する | ConflictError がスローされる | 未実装 |
| 同じ email への期限切れ招待が存在する | createInvitation を実行する | 新しい招待が正常に作成される | 未実装 |
| 同じ email への辞退済み招待が存在する | createInvitation を実行する | 新しい招待が正常に作成される | 未実装 |
| 有効な入力が提供されている | email に不正な形式を指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | role に無効な値を指定して実行する | ValidationError がスローされる | 未実装 |
| 存在しない tenantId が指定されている | createInvitation を実行する | NotFoundError がスローされる | 未実装 |
| 存在しない invitedByMemberId が指定されている | createInvitation を実行する | NotFoundError がスローされる | 未実装 |
