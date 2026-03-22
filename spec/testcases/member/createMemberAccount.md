# createMemberAccount — テナントメンバーアカウントを作成する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な authUserId, name, email が提供されている | createMemberAccount を実行する | アカウントが正常に作成され、authUserId, name, email が返却される | 未実装 |
| 有効な入力が提供されている | createMemberAccount を実行する | 出力DTOに authUserId, name, email が正しく含まれている | 未実装 |
| 同じ authUserId のアカウントが既に存在する | 同じ authUserId で createMemberAccount を実行する | ConflictError がスローされる | 未実装 |
| 有効な入力が提供されている | authUserId に空文字列を指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | name に空文字列を指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | email に不正な形式の文字列を指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | email に空文字列を指定して実行する | ValidationError がスローされる | 未実装 |
