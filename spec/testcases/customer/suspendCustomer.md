# suspendCustomer — 顧客アカウントを停止する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブな顧客が存在する | suspendCustomerを実行する | 顧客アカウントが停止状態になる | 未実装 |
| 停止後の顧客を取得する | getCustomerを実行する | ステータスが停止中になっている | 未実装 |
| 既に停止中の顧客が存在する | suspendCustomerを実行する | ConflictErrorがスローされる | 未実装 |
| 存在しないcustomerIdを指定する | suspendCustomerを実行する | NotFoundErrorがスローされる | 未実装 |
| アクティブな顧客に未来の予約がある | suspendCustomerを実行する | 顧客アカウントが停止状態になる（予約の扱いは別途考慮） | 未実装 |
