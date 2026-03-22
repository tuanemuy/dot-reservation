# updateReservationSettings — 予約設定を更新する テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アクティブなテナントが存在する | 全項目に有効な値を設定してupdateReservationSettingsを実行する | 予約設定が正常に更新される | 未実装 |
| アクティブなテナントが存在する | approvalMethodを"auto"に設定する | 承認方法が自動承認に更新される | 未実装 |
| アクティブなテナントが存在する | approvalMethodを"manual"に設定する | 承認方法が手動承認に更新される | 未実装 |
| アクティブなテナントが存在する | approvalMethodに無効な値（例: "invalid"）を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | bookingWindowDaysに0以下の値を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | bookingDeadlineHoursに負の値を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | cancellationDeadlineHoursに負の値を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | slotDurationMinutesに0以下の値を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | bufferMinutesに負の値を設定する | ValidationErrorがスローされる | 未実装 |
| 存在しないtenantIdを指定する | updateReservationSettingsを実行する | NotFoundErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | slotDurationMinutesに非整数値を設定する | ValidationErrorがスローされる | 未実装 |
| アクティブなテナントが存在する | bookingWindowDaysに極端に大きい値（例: 10000）を設定する | ValidationErrorがスローされる | 未実装 |
