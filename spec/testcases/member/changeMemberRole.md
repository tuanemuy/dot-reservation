# changeMemberRole — メンバーのロールを変更する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 対象メンバーがテナントに所属しており、ロールが staff である | newRole を admin に指定して changeMemberRole を実行する | ロールが admin に変更される | 未実装 |
| 対象メンバーがテナントに所属しており、ロールが admin である。管理者は他にも存在する | newRole を staff に指定して changeMemberRole を実行する | ロールが staff に変更される | 未実装 |
| 操作者自身が対象メンバーである | 自分自身の targetMemberId で changeMemberRole を実行する | ForbiddenError がスローされる | 未実装 |
| 対象メンバーがテナント唯一の管理者である | newRole を staff に指定して changeMemberRole を実行する | ConflictError がスローされる | 未実装 |
| 対象メンバーのロールが admin である | newRole を staff に変更する | StaffProfile が自動作成される | 未実装 |
| 対象メンバーのロールが staff であり、StaffProfile が存在する | newRole を admin に変更する | StaffProfile は保持されたまま残る | 未実装 |
| 対象メンバーがテナントに所属していない | changeMemberRole を実行する | NotFoundError がスローされる | 未実装 |
| 無効な newRole（admin, staff 以外）が指定されている | changeMemberRole を実行する | ValidationError がスローされる | 未実装 |
| 存在しない tenantId が指定されている | changeMemberRole を実行する | NotFoundError がスローされる | 未実装 |
