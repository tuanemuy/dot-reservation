# listCustomers — 顧客一覧を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 複数の顧客が存在する | フィルターなしでlistCustomersを実行する | 全顧客の一覧とtotalCountが返却される | 未実装 |
| 顧客が0件の場合 | listCustomersを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| 名前に"田中"を含む顧客が存在する | keyword: "田中"でlistCustomersを実行する | 名前に"田中"を含む顧客のみ返却される | 未実装 |
| メールアドレスに"example.com"を含む顧客が存在する | keyword: "example.com"でlistCustomersを実行する | メールアドレスに"example.com"を含む顧客のみ返却される | 未実装 |
| キーワードに一致する顧客が存在しない | keyword: "存在しないキーワード"でlistCustomersを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| アクティブな顧客と停止中の顧客が存在する | status: "active"でlistCustomersを実行する | アクティブな顧客のみ返却される | 未実装 |
| アクティブな顧客と停止中の顧客が存在する | status: "suspended"でlistCustomersを実行する | 停止中の顧客のみ返却される | 未実装 |
| 顧客が15件存在する | page: 1, limit: 10でlistCustomersを実行する | 10件の一覧とtotalCount: 15が返却される | 未実装 |
| 顧客が15件存在する | page: 2, limit: 10でlistCustomersを実行する | 5件の一覧とtotalCount: 15が返却される | 未実装 |
| 顧客が5件存在する | page: 2, limit: 10でlistCustomersを実行する | 空の一覧とtotalCount: 5が返却される | 未実装 |
| page: 0またはlimit: 0を指定する | listCustomersを実行する | ValidationErrorがスローされる | 未実装 |
| limit: 負の値を指定する | listCustomersを実行する | ValidationErrorがスローされる | 未実装 |
| keywordとstatusの両方を指定する | listCustomersを実行する | 両方の条件を満たす顧客のみ返却される | 未実装 |
