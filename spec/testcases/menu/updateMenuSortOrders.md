# updateMenuSortOrders — メニューの並び順を変更する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| テナントにメニューが複数存在する | 全メニューの新しい sortOrder を指定して updateMenuSortOrders を実行する | 並び順が正常に変更される | 未実装 |
| テナントにメニューが3件存在する（sortOrder: 1, 2, 3） | 順番を逆転（3, 2, 1）に変更して実行する | 並び順が逆転して反映される | 未実装 |
| テナントにメニューが複数存在する | 一部のメニューのみの sortOrder を指定して実行する | 指定されたメニューの並び順のみが変更される | 未実装 |
| 存在しない menuId が items に含まれている | updateMenuSortOrders を実行する | NotFoundError がスローされる | 未実装 |
| 空の items 配列が指定されている | updateMenuSortOrders を実行する | ValidationError がスローされる、もしくは何も変更されない | 未実装 |
| sortOrder に重複した値が指定されている | updateMenuSortOrders を実行する | ValidationError がスローされる | 未実装 |
| sortOrder に負の値が指定されている | updateMenuSortOrders を実行する | ValidationError がスローされる | 未実装 |
| 並び順変更後 | listMenus を実行する | 新しい並び順でメニューが返却される | 未実装 |
