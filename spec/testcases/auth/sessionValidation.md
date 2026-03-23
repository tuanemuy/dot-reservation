# セッション検証テストケース

## AuthProvider.getSession

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効なセッション Cookie がある | getSession(headers) を呼び出す | user と session を含むオブジェクトが返る | |
| セッション Cookie がない | getSession(headers) を呼び出す | null が返る | |
| 期限切れのセッション Cookie がある | getSession(headers) を呼び出す | null が返る | |
| 無効なトークンの Cookie がある | getSession(headers) を呼び出す | null が返る | |
| BAN されたユーザーのセッション Cookie がある | getSession(headers) を呼び出す | null が返る（BAN 時にセッションは無効化済み） | |

## AuthProvider.deleteUser

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 認証ユーザーが存在する | deleteUser(userId) を呼び出す | ユーザー、セッション、アカウント情報がすべて削除される | |
| 存在しない userId を指定 | deleteUser(userId) を呼び出す | エラーなく完了する（冪等） | |

## AuthProvider.banUser

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなユーザーが存在する | banUser(userId) を呼び出す | ユーザーが BAN 状態になり、既存セッションがすべて無効化される | |
| ユーザーに理由を指定して BAN | banUser(userId, "利用規約違反") を呼び出す | banReason が設定される | |
| 既に BAN 済みのユーザー | banUser(userId) を呼び出す | エラーなく完了する（冪等） | |

## AuthProvider.unbanUser

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| BAN 状態のユーザーが存在する | unbanUser(userId) を呼び出す | BAN が解除され、ログインが可能になる | |
| BAN されていないユーザー | unbanUser(userId) を呼び出す | エラーなく完了する（冪等） | |
