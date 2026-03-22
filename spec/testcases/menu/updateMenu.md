# updateMenu — メニューを更新する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| メニューが存在する | 有効な name, duration, price を指定して updateMenu を実行する | メニューが正常に更新され、id, name が返却される | 未実装 |
| メニューが存在する | name のみ変更して updateMenu を実行する | name が更新される | 未実装 |
| メニューが存在する | category と description を更新して updateMenu を実行する | category と description が更新される | 未実装 |
| メニューが存在し、category が設定されている | category を null に変更して updateMenu を実行する | category が null にクリアされる | 未実装 |
| 同一テナント内に他のメニューが存在する | 他のメニューと同じ name に変更して updateMenu を実行する | ConflictError がスローされる | 未実装 |
| メニューが存在する | 現在と同じ name で updateMenu を実行する | 正常に更新される（自分自身との重複は許容） | 未実装 |
| 存在しない menuId が指定されている | updateMenu を実行する | NotFoundError がスローされる | 未実装 |
| メニューが存在する | duration を15分未満に変更して updateMenu を実行する | ValidationError がスローされる | 未実装 |
| メニューが存在する | duration を15に変更して updateMenu を実行する | 正常に更新される（境界値） | 未実装 |
| メニューが存在する | price を負の値に変更して updateMenu を実行する | ValidationError がスローされる | 未実装 |
| メニューが存在する | name に空文字列を指定して updateMenu を実行する | ValidationError がスローされる | 未実装 |
