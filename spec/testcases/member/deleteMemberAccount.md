# deleteMemberAccount — テナントメンバーアカウントを削除する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| メンバーアカウントが存在し、所属テナントで唯一の管理者ではない | deleteMemberAccount を実行する | アカウントが正常に削除される | 未実装 |
| メンバーがいずれかのテナントで唯一の管理者である | deleteMemberAccount を実行する | ConflictError がスローされる | 未実装 |
| メンバーが複数のテナントに所属している | deleteMemberAccount を実行する | 全テナントから脱退される | 未実装 |
| メンバーが担当する予約が存在する | deleteMemberAccount を実行する | 担当予約の担当者が「担当者未定」に変更される | 未実装 |
| メンバーがどのテナントにも所属していない | deleteMemberAccount を実行する | アカウントが正常に削除される | 未実装 |
| 存在しない authUserId が指定されている | deleteMemberAccount を実行する | NotFoundError がスローされる | 未実装 |
| メンバーが StaffProfile を持っている | deleteMemberAccount を実行する | StaffProfile も削除される | 未実装 |
| メンバーが複数テナントの管理者だが、各テナントに他の管理者もいる | deleteMemberAccount を実行する | アカウントが正常に削除され、全テナントから脱退される | 未実装 |
