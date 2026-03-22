# listMemberTenants — 所属テナント一覧を取得する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| メンバーが複数のテナントに所属している | authUserId を指定して listMemberTenants を実行する | 所属する全テナントの名前とロールの一覧が返却される | 未実装 |
| メンバーがどのテナントにも所属していない | listMemberTenants を実行する | 空の items 配列が返却される | 未実装 |
| メンバーが1つのテナントに所属している | listMemberTenants を実行する | 1件のテナント情報が返却される | 未実装 |
| メンバーが異なるロール（admin, staff）で複数テナントに所属している | listMemberTenants を実行する | 各テナントに対応する正しいロールが返却される | 未実装 |
| 存在しない authUserId が指定されている | listMemberTenants を実行する | NotFoundError がスローされる、もしくは空配列が返却される | 未実装 |
