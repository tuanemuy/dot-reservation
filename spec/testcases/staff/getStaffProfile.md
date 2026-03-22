# getStaffProfile - スタッフ詳細を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| スタッフプロフィールが存在し、担当メニューが設定されている | staffProfileId を指定してスタッフ詳細を取得する | id, displayName, imageUrl, bio, assignedMenus が正しく返される | 未実装 |
| スタッフプロフィールが存在し、担当メニューが0件である | staffProfileId を指定してスタッフ詳細を取得する | assignedMenus が空配列で返される | 未実装 |
| スタッフプロフィールが存在し、imageUrl が null である | staffProfileId を指定してスタッフ詳細を取得する | imageUrl が null で返される | 未実装 |
| スタッフプロフィールが存在し、bio が null である | staffProfileId を指定してスタッフ詳細を取得する | bio が null で返される | 未実装 |
| 指定した staffProfileId のプロフィールが存在しない | 存在しない staffProfileId を指定してスタッフ詳細を取得する | NotFoundError がスローされる | 未実装 |
| スタッフプロフィールが存在し、担当メニューが複数設定されている | staffProfileId を指定してスタッフ詳細を取得する | assignedMenus に MenuSummary の配列が正しく返される | 未実装 |
