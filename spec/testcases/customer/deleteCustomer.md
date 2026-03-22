# deleteCustomer — 顧客アカウントを削除する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブな顧客が存在し、未来の予約がない | deleteCustomerを実行する | 顧客アカウントが削除される | 未実装 |
| 削除された顧客のcustomerIdを指定する | getCustomerを実行する | NotFoundErrorがスローされる（削除が永続化されている） | 未実装 |
| アクティブな顧客が存在し、未来の確定予約がある | deleteCustomerを実行する | ConflictErrorがスローされる | 未実装 |
| アクティブな顧客が存在し、過去の予約のみある | deleteCustomerを実行する | 顧客アカウントが削除される | 未実装 |
| アクティブな顧客が存在し、キャンセル済みの未来の予約がある | deleteCustomerを実行する | 顧客アカウントが削除される（キャンセル済み予約は影響しない） | 未実装 |
| 存在しないcustomerIdを指定する | deleteCustomerを実行する | NotFoundErrorがスローされる | 未実装 |
| 停止中の顧客が存在し、未来の予約がない | deleteCustomerを実行する | 顧客アカウントが削除される | 未実装 |
| 停止中の顧客が存在し、未来の確定予約がある | deleteCustomerを実行する | ConflictErrorがスローされる | 未実装 |
