# removeMember — メンバーを削除する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 対象メンバーがテナントに所属しており、管理者は他にも存在する | removeMember を実行する | メンバーがテナントから正常に削除される | 未実装 |
| 操作者自身が対象メンバーである | 自分自身の targetMemberId で removeMember を実行する | ForbiddenError がスローされる | 未実装 |
| 対象メンバーがテナント唯一の管理者である | removeMember を実行する | ConflictError がスローされる | 未実装 |
| 対象メンバーが削除された | — | 削除されたメンバーに通知が送信される | 未実装 |
| 対象メンバーが担当する予約が存在する | removeMember を実行する | 担当予約の担当者が「担当者未定」に変更される | 未実装 |
| 対象メンバーがテナントに所属していない | removeMember を実行する | NotFoundError がスローされる | 未実装 |
| 存在しない tenantId が指定されている | removeMember を実行する | NotFoundError がスローされる | 未実装 |
| 対象メンバーがスタッフロールで StaffProfile を持っている | removeMember を実行する | StaffProfile も削除される | 未実装 |
