# updateCustomerProfile — プロフィールを更新する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブな顧客が存在する | displayNameを新しい値に変更してupdateCustomerProfileを実行する | 更新後のdisplayNameが新しい値になっている | 未実装 |
| アクティブな顧客が存在する | phoneNumberを設定してupdateCustomerProfileを実行する | 更新後のphoneNumberが設定した値になっている | 未実装 |
| アクティブな顧客にphoneNumberが設定されている | phoneNumberをnullに更新する | 更新後のphoneNumberがnullになっている | 未実装 |
| 存在しないcustomerIdを指定する | updateCustomerProfileを実行する | NotFoundErrorがスローされる | 未実装 |
| アクティブな顧客が存在する | displayNameを空文字に変更してupdateCustomerProfileを実行する | ValidationErrorがスローされる | 未実装 |
| アクティブな顧客が存在する | displayNameを空白文字のみに変更してupdateCustomerProfileを実行する | ValidationErrorがスローされる | 未実装 |
| アクティブな顧客が存在する | displayNameを最大文字数超過で更新する | ValidationErrorがスローされる | 未実装 |
| アクティブな顧客が存在する | phoneNumberを不正な形式で更新する（例: "abc"） | ValidationErrorがスローされる | 未実装 |
| 停止中の顧客が存在する | updateCustomerProfileを実行する | エラーがスローされる（停止中は更新不可） | 未実装 |
