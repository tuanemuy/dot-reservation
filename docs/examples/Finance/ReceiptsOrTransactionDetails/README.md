# Receipts or Transaction Details

Receipts or Transaction Details sections display comprehensive records of purchases or payments with all essential information.

## PaymentReceivedTransactionDetails

説明: 完了した送金取引の詳細を表示する2カラムカードコンポーネント。左側にタイムライン形式の取引履歴（更新ステップ）を表示し、各ステップにタイムスタンプと説明を含む。最終ステップには成功を示す緑のチェックマークアイコンを配置。右側には取引詳細（送金額、手数料、受取額）と受取人詳細（口座名義、SWIFT/BIC、IBAN、メール、銀行名）を表示。ダウンロードボタンでレポート出力が可能。

主なユースケース: 送金完了後の取引確認画面、取引履歴の詳細表示、送金レシート・明細の表示、カスタマーサポート向けの取引情報参照

## PaymentRequestTransactionDetails

説明: 支払いリクエストの詳細を表示するコンパクトなカードコンポーネント。金額、ステータス（Pendingバッジ）、有効期限、参照番号、備考、支払いリンク（クリップボードコピー機能付き）、作成日を2カラムのdescription list形式で表示する。

主なユースケース: 支払いリクエストの詳細確認画面、請求書リンクの共有、リクエスト状況の追跡、未払い請求の管理

## PaymentSendingConfirmationDetails

説明: 送金前の確認画面を構成する包括的なカードコンポーネント。Transfer details（送金額、手数料、実送金額）、Recipient details（受取人口座情報）、Schedule details（送金タイミング、到着予定日）、Payment method（選択した決済方法）の4セクションで構成。各セクションにEdit/Changeリンクを配置し、モーダルで決済方法の変更が可能。決済方法選択モーダルでは、最近使用した方法とその他の方法（デビットカード、銀行口座、Wire transfer、SWIFT）を手数料・到着予定日と共にリスト表示。

主なユースケース: 送金フローの最終確認ステップ、国際送金の詳細確認、決済方法の選択・変更、送金内容のレビュー画面
