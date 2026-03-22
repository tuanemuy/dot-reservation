# createCustomer — 顧客アカウントを作成する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効なauthUserId、displayName、emailが入力される | createCustomerを実行する | 顧客エンティティが作成され、id・displayName・emailが返却される | 未実装 |
| 作成された顧客が存在する | 作成された顧客をIDで取得する | 保存されたdisplayNameとemailが入力値と一致する | 未実装 |
| 同じauthUserIdを持つ顧客が既に存在する | 同じauthUserIdでcreateCustomerを実行する | ConflictErrorがスローされる | 未実装 |
| displayNameが空文字で入力される | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| displayNameが空白文字のみで入力される | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| emailが空文字で入力される | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| emailが不正な形式で入力される（例: "invalid-email"） | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| authUserIdが空文字で入力される | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| displayNameが最大文字数を超えている | createCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| 正常に顧客が作成される | 作成後の顧客のステータスを確認する | ステータスがアクティブ状態である | 未実装 |
