# createMenu — メニューを作成する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な tenantId, name, duration, price が提供されている | createMenu を実行する | メニューが正常に作成され、id, name が返却される | 未実装 |
| 有効な入力に加え category と description が提供されている | createMenu を実行する | category と description を含むメニューが作成される | 未実装 |
| category と description が null である | createMenu を実行する | category と description が null のメニューが作成される | 未実装 |
| 同一テナント内に同名のメニューが既に存在する | 同じ name で createMenu を実行する | ConflictError がスローされる | 未実装 |
| 異なるテナントに同名のメニューが存在する | 同じ name で createMenu を実行する | メニューが正常に作成される（テナント間で名前の重複は許容） | 未実装 |
| 有効な入力が提供されている | duration を14（15分未満）に指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | duration を15に指定して実行する | メニューが正常に作成される（境界値） | 未実装 |
| 有効な入力が提供されている | duration を0に指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | duration を負の値に指定して実行する | ValidationError がスローされる | 未実装 |
| テナントに既存のメニューが複数存在する | createMenu を実行する | 表示順が末尾（既存メニューの後）に追加される | 未実装 |
| テナントにメニューが存在しない | createMenu を実行する | 表示順が先頭（1番目）に設定される | 未実装 |
| 有効な入力が提供されている | price を0に指定して実行する | メニューが正常に作成される（無料メニュー） | 未実装 |
| 有効な入力が提供されている | price を負の値に指定して実行する | ValidationError がスローされる | 未実装 |
| 有効な入力が提供されている | name に空文字列を指定して実行する | ValidationError がスローされる | 未実装 |
| 存在しない tenantId が指定されている | createMenu を実行する | NotFoundError がスローされる | 未実装 |
