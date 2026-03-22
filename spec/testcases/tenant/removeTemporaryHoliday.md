# removeTemporaryHoliday — 臨時休業日を削除する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなテナントに臨時休業日が登録されている | 登録済みの日付を指定してremoveTemporaryHolidayを実行する | 臨時休業日が正常に削除される | 未実装 |
| 臨時休業日を削除した後 | テナント情報を取得して臨時休業日一覧を確認する | 削除した日付が一覧に含まれていない | 未実装 |
| アクティブなテナントが存在する | 登録されていない日付を指定してremoveTemporaryHolidayを実行する | NotFoundErrorがスローされる | 未実装 |
| 存在しないtenantIdを指定する | removeTemporaryHolidayを実行する | NotFoundErrorがスローされる | 未実装 |
| 過去の臨時休業日が登録されている | 過去の日付を指定してremoveTemporaryHolidayを実行する | 正常に削除される（過去のデータのクリーンアップ） | 未実装 |
