# getTenant — テナント情報を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなテナントが存在する | tenantIdを指定してgetTenantを実行する | テナント情報（全フィールド）が返却される | 未実装 |
| アクティブなテナントが存在する | urlPathを指定してgetTenantを実行する | テナント情報が返却される | 未実装 |
| 存在しないtenantIdを指定する | getTenantを実行する | NotFoundErrorがスローされる | 未実装 |
| 存在しないurlPathを指定する | getTenantを実行する | NotFoundErrorがスローされる | 未実装 |
| tenantIdもurlPathも指定しない | getTenantを実行する | ValidationErrorがスローされる | 未実装 |
| 停止中のテナントが存在する | tenantIdを指定してgetTenantを実行する | 停止中ステータスのテナント情報が返却される | 未実装 |
| 停止中のテナントが存在する | urlPathを指定して顧客としてgetTenantを実行する | テナント情報が返却され、停止中であることが分かる | 未実装 |
| テナントにdescriptionが未設定 | getTenantを実行する | descriptionがnullで返却される | 未実装 |
| テナントにimageUrlsが空配列 | getTenantを実行する | imageUrlsが空配列で返却される | 未実装 |
| テナントに営業時間・定休日・臨時休業日・予約設定が設定されている | getTenantを実行する | 全関連情報が正しく返却される | 未実装 |
