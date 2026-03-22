# updateTenantProfile — テナント情報を更新する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなテナントが存在する | nameを新しい値に変更してupdateTenantProfileを実行する | 更新後のnameが新しい値になっている | 未実装 |
| アクティブなテナントが存在する | urlPathを新しい値に変更してupdateTenantProfileを実行する | 更新後のurlPathが新しい値になっている | 未実装 |
| テナントAのurlPathを変更した | 旧urlPathで別のテナントBを作成する | テナントBが正常に作成される（旧urlPathが使用可能になっている） | 未実装 |
| テナントBが使用中のurlPathが存在する | テナントAのurlPathをテナントBと同じ値に変更する | ConflictErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | descriptionを設定してupdateTenantProfileを実行する | 更新後のdescriptionが設定した値になっている | 未実装 |
| テナントにdescriptionが設定されている | descriptionをnullに更新する | 更新後のdescriptionがnullになっている | 未実装 |
| アクティブなテナントが存在する | imageUrlsを10枚以内で設定する | 正常に更新される | 未実装 |
| アクティブなテナントが存在する | imageUrlsを11枚以上で設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | imageUrlsを空配列で設定する | 正常に更新される（画像なし） | 未実装 |
| 存在しないtenantIdを指定する | updateTenantProfileを実行する | NotFoundErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | nameを空文字に変更する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | postalCodeを不正な形式に変更する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | phoneNumberを空文字に変更する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | addressのprefectureを空文字に変更する | ValidationErrorがスローされる | 未実装 |
