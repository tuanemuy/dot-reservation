# Code Review #4

**Date:** 2026-03-23
**Round:** 1回目 (全レイヤーフルレビュー)

---

## Summary

- Blockers: 22
- Warnings: 33
- Notes: 26
- Verdict: **BLOCKED**

---

## ドメイン層

### Blockers

- **[D-B-001]** Staff ドメインが WithEvents を返していない
  - 場所: `app/core/domain/staff/entity.ts:23-84`
  - 理由: `StaffProfile.create()` が `WithEvents` 型でなく単純な `StaffProfile` を返している。他のエンティティは WithEvents パターンを使用しており一貫性がない
  - 提案: StaffProfile.create() の戻り値を `WithEvents<StaffProfile, StaffProfileEvent>` に変更するか、イベント不要の理由を明確化

- **[D-B-002]** Notification エンティティが WithEvents を返していない
  - 場所: `app/core/domain/notification/entity.ts:27-49`
  - 理由: `Notification.create()` が WithEvents 型でない。他エンティティとの一貫性の問題
  - 提案: 通知生成がイベントハンドラー経由の場合、イベント不要な理由を明確化

- **[D-B-003]** Reservation.canModify() と canCancel() が同じロジック
  - 場所: `app/core/domain/reservation/entity.ts:316-336`
  - 理由: 変更期限とキャンセル期限が同じ `cancellationDeadlineHours` を使用。設計上意図的か確認必要
  - 提案: 変更とキャンセルの期限が異なる場合、別フィールドを追加

- **[D-B-004]** 時刻の文字列分割にエラーハンドリングなし
  - 場所: `app/core/domain/reservation/entity.ts:307-308, 329-330`
  - 理由: `startTime.split(":").map(Number)` で配列長の確認がない
  - 提案: TimeOfDay 値オブジェクトに `toMinutes()` メソッドを追加して使用

- **[D-B-005]** NotificationPreference にイベント定義がない
  - 場所: `app/core/domain/notification/`
  - 理由: events.ts や NotificationPreferenceEvent 型が存在しない
  - 提案: イベント不要であれば明確化、必要であれば追加

### Warnings

- **[D-W-001]** StaffProfile.create() のイベント発行パターンの不一貫
- **[D-W-002]** Reservation.update() の endTime パラメータの startTime < endTime 検証なし
- **[D-W-003]** AvailabilityService のヘルパー関数がエクスポートされていない
- **[D-W-004]** Shift.containsTime() の終端判定が開区間（設計意図確認）
- **[D-W-005]** MemberPolicyService の純粋関数パターンが良好（正の評価）
- **[D-W-006]** Tenant.isOperatingOn() と getOperatingHoursOn() の重複チェック
- **[D-W-007]** TimeOfDay 検証の15分単位制約と他エンティティの粒度不一致

---

## アダプター層

### Blockers

- **[A-B-001]** outboxRepository: event payload の構造検証なし
  - 場所: `app/core/adapters/drizzleSqlite/repositories/outboxRepository.ts:50`
  - 理由: `JSON.parse()` 結果を直接返しており、payload 破損時にランタイムエラーの可能性
  - 提案: 型ガード関数で検証後に返す

- **[A-B-002]** reservationRepository: 日付時刻比較に raw SQL 使用
  - 場所: `app/core/adapters/drizzleSqlite/repositories/reservationRepository.ts:387-402`
  - 理由: SQLite の日付文字列フォーマットに依存。parseLocalDate とのフォーマット不一致の可能性
  - 提案: Drizzle ORM のネイティブ比較演算子に統一

- **[A-B-003]** tenantRepository: temporaryHolidays の DELETE → INSERT が非アトミック
  - 場所: `app/core/adapters/drizzleSqlite/repositories/tenantRepository.ts:166-180`
  - 理由: UOW トランザクション内なら問題ないが、明示性に欠ける
  - 提案: トランザクション前提であることをコメントで明確化

- **[A-B-004]** BetterAuthProvider: deleteUser() が全例外をサイレント無視
  - 場所: `app/core/adapters/betterAuth/authProvider.ts:49-51`
  - 理由: DB 接続エラー等の本当のエラーも無視される
  - 提案: 「ユーザー不在」エラーのみ無視し、他は SystemError として throw

- **[A-B-005]** menuRepository: updateSortOrders() がループで個別 UPDATE
  - 場所: `app/core/adapters/drizzleSqlite/repositories/menuRepository.ts:144-161`
  - 理由: N回のDB往復が発生。パフォーマンス問題
  - 提案: CASE/WHEN で1クエリに統合

- **[A-B-006]** staffProfileRepository: assignedMenus の DELETE → INSERT が非アトミック
  - 場所: `app/core/adapters/drizzleSqlite/repositories/staffProfileRepository.ts:71-83`
  - 理由: A-B-003 と同様
  - 提案: トランザクション前提であることを明確化

### Warnings

- **[A-W-001]** customerRepository.findAll() の count 型キャスト
- **[A-W-002]** PaginationResult の戻り値キー名の統一確認
- **[A-W-003]** notificationRepository: boolean → integer 変換が手動・散在
- **[A-W-004]** onConflictDoUpdate の target 指定が主キーのみ
- **[A-W-005]** outboxRepository: イベント payload の型が any
- **[A-W-006]** リポジトリ間の日付パースロジック不統一
- **[A-W-007]** authProvider: role と banned のデフォルト値処理

---

## ユースケース層

### Blockers

- **[U-B-001]** 招待メール送信がトランザクション内で実行されている
  - 場所: `app/core/application/member/createInvitation.ts:95-99`, `resendInvitation.ts:61-65`
  - 理由: トランザクション内での I/O は Outbox パターンの意図に反する
  - 提案: トランザクション外でメール送信するか、Outbox イベント経由に変更

### Warnings

- **[U-W-001]** acceptInvitation で email を name として使用
- **[U-W-002]** cleanupAuthUserIfOrphaned の失敗時ハンドリングが console.error のみ
- **[U-W-003]** updateReservation での型アサーション
- **[U-W-004]** listTenants と searchTenants の重複型アサーション
- **[U-W-005]** createNotification の message null/undefined チェック不足
- **[U-W-006]** AuthProvider エラーハンドリングが緩い

---

## テスト層

### Blockers

- **[T-B-001]** BusinessRuleError vs ValidationError の混在
  - 場所: 複数テストファイル（createCustomer, createInvitation, createMemberAccount）
  - 理由: CLAUDE.md では Application Layer は ValidationError を使うべきだが、テストは BusinessRuleError を期待
  - 提案: 設計意図を確認し、エラー型を統一

- **[T-B-002]** createMemberAccount の重複チェックテスト未実装
  - 場所: `app/core/application/member/__tests__/createMemberAccount.test.ts`
  - 理由: spec で定義された「同じ authUserId の ConflictError」テストがない
  - 提案: テストケースを追加

- **[T-B-003]** authUserId の空文字バリデーション未実装
  - 場所: `app/core/application/customer/__tests__/createCustomer.test.ts:159-176`
  - 理由: spec では空文字で ValidationError だが、実装ではエラーなく成功
  - 提案: バリデーションを実装しテストを修正

- **[T-B-004]** createReservation のテストカバレッジ不足
  - 場所: `app/core/application/reservation/__tests__/createReservation.test.ts`
  - 理由: spec の31ケース中17ケースのみ実装。複数の重要ケースが不足
  - 提案: spec に定義された全テストケースを実装

### Warnings

- **[T-W-001]** displayName 空白文字のバリデーション仕様が曖昧
- **[T-W-002]** authIntegration.md のセッション検証テストがフロントエンド層に未実装
- **[T-W-003]** テスト内でリポジトリ直接操作による実装依存

---

## フロントエンド層

### Blockers

- **[F-B-001]** 認証情報の取得方法が一貫していない
  - 場所: 複数のLoader（`shop.$urlPath.reserve.tsx:163`, `mypage/reservations/index.tsx:44` 等）
  - 理由: `x-customer-id` ヘッダーと `authProvider.getSession()` が混在
  - 提案: すべて `authProvider.getSession()` に統一

- **[F-B-002]** TODO・FIXME・仮実装が多数残存
  - 場所: `admin/new-tenant.tsx:52-73`, `admin/tenants.tsx:13-26`, `mypage/profile.tsx:74-82`, platform/ 配下等
  - 理由: 仮実装のままでは機能が動作しない
  - 提案: 各 TODO を実装完了するか、スコープ外として明確化

- **[F-B-003]** 認証ローダーでリポジトリ直接呼び出しとユースケース経由が混在
  - 場所: `mypage/layout.tsx:13-19`, `admin/$tenantId/layout.tsx:14-15`
  - 理由: ヘキサゴナルアーキテクチャではプレゼンテーション層からリポジトリ直接呼び出しは避けるべき
  - 提案: すべてユースケース経由に統一

- **[F-B-004]** ダッシュボードで Tailwind カラークラスとデザインシステムが混在
  - 場所: `admin/$tenantId/dashboard.tsx:56-62`
  - 理由: `text-gray-900`, `bg-gray-50` とデザインシステムの `text-text`, `bg-surface-secondary` が混在
  - 提案: デザインシステムのカラートークンに統一

- **[F-B-005]** 予約変更ページの実装完全性未確認
  - 場所: `mypage/reservations/$id/edit.tsx`
  - 理由: 実装の完全性が確認できない
  - 提案: ファイル全体を確認

- **[F-B-006]** authClient と authProvider の関係性が不明確
  - 場所: `customer/login.tsx:45-58`, `admin/login.tsx:47-64`
  - 理由: クライアントサイドの authClient とサーバーサイドの authProvider のセッション同期が不確実
  - 提案: 認証フローの設計を文書化し統一

### Warnings

- **[F-W-001]** statusBadgeVariants 型定義の複数ファイル重複
- **[F-W-002]** Loader エラーハンドリングの不一貫性
- **[F-W-003]** 公開ページヘッダーのログイン状態切り替え未実装
- **[F-W-004]** Loader 内の複数 await が並列実行されていない
- **[F-W-005]** 予約フローのステップ定義がハードコード
- **[F-W-006]** モーダルの a11y 対応不完全
- **[F-W-007]** フォームエラー表示の一貫性
- **[F-W-008]** 予約状態ラベルの重複定義
- **[F-W-009]** スタッフ画像サイズの不統一
- **[F-W-010]** ページネーションの searchParams 処理確認

---

## 品質ゲート結果

- typecheck: PASS
- lint: PASS (122 warnings, 既存のもの)
- test: PASS (610 tests)
