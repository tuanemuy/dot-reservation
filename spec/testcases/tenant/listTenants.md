# listTenants — テナント一覧を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 複数のテナントが存在する | フィルターなしでlistTenantsを実行する | 全テナントの一覧とtotalCountが返却される | 未実装 |
| テナントが0件の場合 | listTenantsを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| 名前に"美容"を含むテナントが存在する | keyword: "美容"でlistTenantsを実行する | 名前に"美容"を含むテナントのみ返却される | 未実装 |
| キーワードに一致するテナントが存在しない | keyword: "存在しないキーワード"でlistTenantsを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| アクティブなテナントと停止中のテナントが存在する | status: "active"でlistTenantsを実行する | アクティブなテナントのみ返却される | 未実装 |
| アクティブなテナントと停止中のテナントが存在する | status: "suspended"でlistTenantsを実行する | 停止中のテナントのみ返却される | 未実装 |
| カテゴリー"美容室"のテナントが存在する | category: "美容室"でlistTenantsを実行する | カテゴリーが"美容室"のテナントのみ返却される | 未実装 |
| テナントが15件存在する | page: 1, limit: 10でlistTenantsを実行する | 10件の一覧とtotalCount: 15が返却される | 未実装 |
| テナントが15件存在する | page: 2, limit: 10でlistTenantsを実行する | 5件の一覧とtotalCount: 15が返却される | 未実装 |
| テナントが5件存在する | page: 2, limit: 10でlistTenantsを実行する | 空の一覧とtotalCount: 5が返却される | 未実装 |
| page: 0またはlimit: 0を指定する | listTenantsを実行する | ValidationErrorがスローされる | 未実装 |
| keyword、status、categoryの複数条件を指定する | listTenantsを実行する | 全条件を満たすテナントのみ返却される | 未実装 |
| statusフィルターなしで取得する | listTenantsを実行する | アクティブ・停止中の全テナントが返却される（searchTenantsとの違い） | 未実装 |
