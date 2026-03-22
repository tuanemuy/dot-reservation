# reactivateCustomer — 顧客アカウントを再開する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 停止中の顧客が存在する | reactivateCustomerを実行する | 顧客アカウントがアクティブ状態になる | 未実装 |
| 再開後の顧客を取得する | getCustomerを実行する | ステータスがアクティブになっている | 未実装 |
| 既にアクティブな顧客が存在する | reactivateCustomerを実行する | ConflictErrorがスローされる | 未実装 |
| 存在しないcustomerIdを指定する | reactivateCustomerを実行する | NotFoundErrorがスローされる | 未実装 |
