# addTemporaryHoliday — 臨時休業日を追加する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなテナントが存在する | 未来の日付とreasonを指定してaddTemporaryHolidayを実行する | 臨時休業日が正常に追加される | 未実装 |
| アクティブなテナントが存在する | 未来の日付でreasonをnullにしてaddTemporaryHolidayを実行する | 臨時休業日がreason無しで追加される | 未実装 |
| アクティブなテナントが存在する | 本日の日付を指定してaddTemporaryHolidayを実行する | 正常に追加される（本日は過去ではない） | 未実装 |
| アクティブなテナントが存在する | 過去の日付を指定してaddTemporaryHolidayを実行する | ValidationErrorがスローされる | 未実装 |
| 同じ日付の臨時休業日が既に登録されている | 同じ日付でaddTemporaryHolidayを実行する | ConflictErrorがスローされる | 未実装 |
| 存在しないtenantIdを指定する | addTemporaryHolidayを実行する | NotFoundErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | 不正な日付形式を指定する（例: "2026-13-01"） | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在し、該当日に予約がある | 臨時休業日を追加する | 臨時休業日が追加される（予約の扱いは別途考慮） | 未実装 |
