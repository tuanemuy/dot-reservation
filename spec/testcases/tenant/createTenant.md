# createTenant — テナントを作成する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な全入力項目が指定される | createTenantを実行する | テナントが作成され、id・name・urlPathが返却される | 未実装 |
| テナントが正常に作成された | 作成者のメンバー情報を確認する | 作成者が管理者ロールのメンバーとして自動登録されている | 未実装 |
| テナントが正常に作成された | テナントの営業設定を確認する | デフォルトの営業設定が初期値で作成されている | 未実装 |
| テナントが正常に作成された | テナントの予約設定を確認する | デフォルトの予約設定が初期値で作成されている | 未実装 |
| 同じurlPathを持つテナントが既に存在する | 同じurlPathでcreateTenantを実行する | ConflictErrorがスローされる | 未実装 |
| nameが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| urlPathが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| urlPathに使用不可文字が含まれている（例: "my store!"） | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| categoryが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| postalCodeが不正な形式で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| addressのprefectureが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| addressのcityが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| phoneNumberが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| authUserIdが空文字で入力される | createTenantを実行する | ValidationErrorがスローされる | 未実装 |
| 正常に作成されたテナントを取得する | テナントのステータスを確認する | ステータスがアクティブ状態である | 未実装 |
