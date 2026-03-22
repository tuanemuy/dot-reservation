# checkUrlPathAvailability — URLパスの使用可否を確認する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 指定したurlPathが未使用である | checkUrlPathAvailabilityを実行する | available: trueが返却される | 未実装 |
| 指定したurlPathが別のテナントで使用中である | checkUrlPathAvailabilityを実行する | available: falseが返却される | 未実装 |
| 指定したurlPathが自テナントで使用中で、excludeTenantIdに自テナントIDを指定する | checkUrlPathAvailabilityを実行する | available: trueが返却される | 未実装 |
| 指定したurlPathが別のテナントで使用中で、excludeTenantIdに自テナントIDを指定する | checkUrlPathAvailabilityを実行する | available: falseが返却される | 未実装 |
| excludeTenantIdを指定しない | 使用中のurlPathでcheckUrlPathAvailabilityを実行する | available: falseが返却される | 未実装 |
| urlPathが空文字で入力される | checkUrlPathAvailabilityを実行する | ValidationErrorがスローされる | 未実装 |
| urlPathに使用不可文字が含まれている（例: "my store!"） | checkUrlPathAvailabilityを実行する | ValidationErrorがスローされる | 未実装 |
| 削除済みテナントが使用していたurlPathを指定する | checkUrlPathAvailabilityを実行する | available: trueが返却される | 未実装 |
