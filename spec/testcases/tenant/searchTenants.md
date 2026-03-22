# searchTenants — 店舗を検索する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 複数のアクティブなテナントが存在する | フィルターなしでsearchTenantsを実行する | 全アクティブテナントの一覧とtotalCountが返却される | 未実装 |
| テナントが0件の場合 | searchTenantsを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| 名前に"美容"を含むテナントが存在する | keyword: "美容"でsearchTenantsを実行する | 名前に"美容"を含むテナントのみ返却される | 未実装 |
| キーワードに一致するテナントが存在しない | keyword: "存在しないキーワード"でsearchTenantsを実行する | 空の一覧とtotalCount: 0が返却される | 未実装 |
| 東京エリアのテナントが存在する | area: "東京"でsearchTenantsを実行する | 東京エリアのテナントのみ返却される | 未実装 |
| カテゴリー"美容室"のテナントが存在する | category: "美容室"でsearchTenantsを実行する | カテゴリーが"美容室"のテナントのみ返却される | 未実装 |
| アクティブなテナントと停止中のテナントが存在する | searchTenantsを実行する | 停止中のテナントは結果に含まれない | 未実装 |
| テナントが15件存在する | page: 1, limit: 10でsearchTenantsを実行する | 10件の一覧とtotalCount: 15が返却される | 未実装 |
| テナントが15件存在する | page: 2, limit: 10でsearchTenantsを実行する | 5件の一覧とtotalCount: 15が返却される | 未実装 |
| テナントが5件存在する | page: 2, limit: 10でsearchTenantsを実行する | 空の一覧とtotalCount: 5が返却される | 未実装 |
| page: 0またはlimit: 0を指定する | searchTenantsを実行する | ValidationErrorがスローされる | 未実装 |
| keyword、area、categoryの複数条件を指定する | searchTenantsを実行する | 全条件を満たすテナントのみ返却される | 未実装 |
| 削除済みテナントが存在する | searchTenantsを実行する | 削除済みテナントは結果に含まれない | 未実装 |
