# reactivateTenant — テナントを再開する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 停止中のテナントが存在する | reactivateTenantを実行する | テナントがアクティブ状態になる | 未実装 |
| 再開後のテナントを取得する | getTenantを実行する | ステータスがアクティブになっている | 未実装 |
| 既に稼働中のテナントが存在する | reactivateTenantを実行する | ConflictErrorがスローされる | 未実装 |
| 存在しないtenantIdを指定する | reactivateTenantを実行する | NotFoundErrorがスローされる | 未実装 |
| 再開後のテナントをsearchTenantsで検索する | searchTenantsを実行する | 再開したテナントが検索結果に含まれる | 未実装 |
