# listMembers — メンバー一覧を取得する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| テナントにメンバーが複数存在する | tenantId を指定して listMembers を実行する | 全メンバーの一覧が返却される | 未実装 |
| テナントに admin と staff のメンバーが存在する | role に admin を指定して listMembers を実行する | admin ロールのメンバーのみが返却される | 未実装 |
| テナントに admin と staff のメンバーが存在する | role に staff を指定して listMembers を実行する | staff ロールのメンバーのみが返却される | 未実装 |
| テナントにメンバーが存在しない | listMembers を実行する | 空の items 配列が返却される | 未実装 |
| テナントにメンバーが複数存在する | role を null（フィルターなし）で listMembers を実行する | 全メンバーが返却される | 未実装 |
| 存在しない tenantId が指定されている | listMembers を実行する | NotFoundError がスローされる、もしくは空配列が返却される | 未実装 |
