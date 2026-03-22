# getCustomer — 顧客情報を取得する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブな顧客が存在する | customerIdを指定してgetCustomerを実行する | 顧客情報（id、displayName、email、phoneNumber、status、createdAt）が返却される | 未実装 |
| アクティブな顧客が存在する | authUserIdを指定してgetCustomerを実行する | 顧客情報が返却される | 未実装 |
| 存在しないcustomerIdを指定する | getCustomerを実行する | NotFoundErrorがスローされる | 未実装 |
| 存在しないauthUserIdを指定する | getCustomerを実行する | NotFoundErrorがスローされる | 未実装 |
| customerIdもauthUserIdも指定しない | getCustomerを実行する | ValidationErrorがスローされる | 未実装 |
| customerIdとauthUserIdの両方を指定する | getCustomerを実行する | いずれかの条件で顧客情報が返却される（customerIdが優先される） | 未実装 |
| 停止中の顧客が存在する | customerIdを指定してgetCustomerを実行する | 停止中ステータスの顧客情報が返却される | 未実装 |
| 顧客にphoneNumberが設定されていない | getCustomerを実行する | phoneNumberがnullで返却される | 未実装 |
