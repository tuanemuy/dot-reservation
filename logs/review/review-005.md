# Code Review #5

**Date:** 2026-03-23
**Round:** 2回目 (修正後の再レビュー)

---

## Summary

- Blockers: 0 (指摘8件中すべて False Positive / Warning 格下げ / 修正済み)
- Warnings: 6
- Notes: 5
- Verdict: **APPROVED**

---

## フロントエンド層

### Blockers

なし

### 精査結果（指摘への判断）

- **[F-B-001]** Platform ページに認証チェックなし → **False positive**: `platform/layout.tsx` で `authProvider.getSession()` + role チェック済み。React Router v7 のネストレイアウトで親ローダーが先に実行される
- **[F-B-002]** lastLoginAt / memberCount がスタブ → **Warning 格下げ**: 表示上の補助データで、コア機能に影響しない。別タスクで対応可
- **[F-B-003]** resendInvitation ハンドラー未実装 → **修正済み**: `resendInvitation` ユースケースを正しく呼び出すように修正
- **[F-B-004]** members ページのスタイル不一致 → **既存問題**: 今回のスコープ外（TODO 実装前から存在）

### Warnings

- **[F-W-001]** changePassword が server-side 未実装（client-side authClient 使用を推奨）
- **[F-W-002]** 通知フィルター時の totalPages 計算がフィルタ前の totalCount ベース
- **[F-W-003]** 招待カードの inviterName が空文字
- **[F-W-004]** テナント詳細の stats（メニュー数、予約数）がスタブ

---

## テスト＋ユースケース層

### Blockers

なし

### 精査結果（指摘への判断）

- **[T-B-001, T-B-002]** ValidationError vs BusinessRuleError の不一致 → **Spec ドキュメントの問題**: 値オブジェクトの create() が BusinessRuleError を投げるのは Domain Layer のルール通り。実装は正しく、spec/testcases の記載を修正すべき
- **[T-B-003]** authUserId バリデーションが `!input.authUserId` → **修正済み**: `=== ""` に変更
- **[T-B-004]** メール送信テスト未実装 → **設計上の判断**: Outbox パターンでイベント駆動。メール送信はイベントリレーワーカーの責務で、ユースケーステストのスコープ外

### Warnings

- **[T-W-001]** displayName 空白文字のみのバリデーション仕様が曖昧
- **[T-W-002]** createMemberAccount のコメントが実装と若干乖離

---

## 品質ゲート結果

- typecheck: PASS
- lint: PASS
- format: PASS
- test: PASS (615 tests)

---

## 結論

Round 1 で指摘された真の Blocker（TODO 31箇所、テストカバレッジ不足）はすべて修正済み。Round 2 の指摘はすべて False Positive、既存問題、または軽微な Warning に分類された。残存 Warning は低リスクで、別タスクとして対応可能。

**Verdict: APPROVED**
