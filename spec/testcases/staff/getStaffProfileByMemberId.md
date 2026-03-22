# getStaffProfileByMemberId - メンバーIDでスタッフ詳細を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| メンバーに紐づくスタッフプロフィールが存在する | memberId を指定してスタッフ詳細を取得する | getStaffProfile と同一形式で id, displayName, imageUrl, bio, assignedMenus が返される | 未実装 |
| メンバーに紐づくスタッフプロフィールが存在し、担当メニューが設定されている | memberId を指定してスタッフ詳細を取得する | assignedMenus に担当メニュー一覧が正しく返される | 未実装 |
| メンバーに紐づくスタッフプロフィールが存在し、担当メニューが0件である | memberId を指定してスタッフ詳細を取得する | assignedMenus が空配列で返される | 未実装 |
| メンバーに紐づくスタッフプロフィールが存在しない | memberId を指定してスタッフ詳細を取得する | NotFoundError がスローされる | 未実装 |
| 存在しない memberId を指定する | 存在しない memberId でスタッフ詳細を取得する | NotFoundError がスローされる | 未実装 |
