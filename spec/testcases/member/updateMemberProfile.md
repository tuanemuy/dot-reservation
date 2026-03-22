# updateMemberProfile — メンバープロフィールを更新する

## テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| メンバーが存在する | 有効な name を指定して updateMemberProfile を実行する | プロフィールが更新され、更新後の id, name, phoneNumber が返却される | 未実装 |
| メンバーが存在する | name と phoneNumber を指定して updateMemberProfile を実行する | name と phoneNumber の両方が更新される | 未実装 |
| メンバーが存在し、phoneNumber が設定されている | phoneNumber を null に指定して updateMemberProfile を実行する | phoneNumber が null にクリアされる | 未実装 |
| メンバーが存在しない | 存在しない memberId で updateMemberProfile を実行する | NotFoundError がスローされる | 未実装 |
| メンバーが存在する | name に空文字列を指定して実行する | ValidationError がスローされる | 未実装 |
| メンバーが存在する | phoneNumber に不正な形式の文字列を指定して実行する | ValidationError がスローされる | 未実装 |
