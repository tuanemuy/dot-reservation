# cleanupAuthUserIfOrphaned テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| authUserId に対して Customer も Member も存在しない | cleanupAuthUserIfOrphaned(authUserId) を実行する | auth ユーザーが削除される | |
| authUserId に対して Customer のみ存在する | cleanupAuthUserIfOrphaned(authUserId) を実行する | auth ユーザーは維持される（何も起きない） | |
| authUserId に対して Member のみ存在する（1テナント） | cleanupAuthUserIfOrphaned(authUserId) を実行する | auth ユーザーは維持される（何も起きない） | |
| authUserId に対して Member のみ存在する（複数テナント） | cleanupAuthUserIfOrphaned(authUserId) を実行する | auth ユーザーは維持される（何も起きない） | |
| authUserId に対して Customer と Member の両方が存在する | cleanupAuthUserIfOrphaned(authUserId) を実行する | auth ユーザーは維持される（何も起きない） | |
| 存在しない authUserId を指定 | cleanupAuthUserIfOrphaned(authUserId) を実行する | エラーなく完了する（冪等） | |
