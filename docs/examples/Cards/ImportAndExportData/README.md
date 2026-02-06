# Import & Export Data

Import & Export data effortlessly with card list groups, revealing dropdown menus, and seamless upload forms.

## Components

### ExportContacts

説明: 連絡先データをエクスポートするためのフォームカード。エクスポートするフィールド（Name、User ID、Email、Address、Phone、Signed up as）を選択するチェックボックス、ファイル形式（Regular CSV/Google CSV）を選択するラジオボタン、日付範囲（Today、Current month、Last 7 days、Last month、All、Custom）を選択するラジオボタンを含む。

主なユースケース: CRM連絡先のバックアップ、メーリングリスト作成のためのデータ抽出、外部サービスへのデータ移行、レポート用データエクスポート

### ImportContacts

説明: 外部サービスから連絡先をインポートするカード。Gmail、Notion、Wordファイルからの接続オプションを提供し、各サービスには「Connect」ボタンが配置される。下部にはDrag and Dropファイルアップロードエリア（CSV、XLS、DOCX対応）を含む。

主なユースケース: 新規サービスへの連絡先移行、既存データのCRMへのインポート、複数ソースからの連絡先統合

### ImportData

説明: 外部サービスからユーザーデータをインポートするカード。Gmail、Notion、CSVからのインポートオプションをリスト形式で表示し、各ソースには「Launch importer」ボタンが配置される。ヘッダーのドロップダウンメニューでShare reports、View in fullscreen、Connect other apps、Submit Feedbackなどのアクションが可能。

主なユースケース: ユーザーデータの一括インポート、マーケティングプラットフォームへのデータ連携、分析ツールへのデータ取り込み
