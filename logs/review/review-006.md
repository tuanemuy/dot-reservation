# Code Review #6

**Date:** 2026-03-23
**Round:** 1回目 (認証・スタブ修正後のレビュー)

---

## Summary

- Blockers: 2 (修正済み)
- Warnings: 10 (4件修正、6件は既存問題 or 許容)
- Notes: 6
- Verdict: **APPROVED (修正適用後)**

---

## フロントエンド層

### Blockers (修正済み)

- **[F-B-001]** menuName が予約一覧カードで2回表示されていた
  - 場所: `app/routes/mypage/reservations/index.tsx:133-138`
  - 修正: 重複した menuName 表示を削除し、サブタイトルは staffName のみ表示

- **[F-B-002]** admin/notifications が `members[0]` のみの通知を表示（テナントスコーピング不足）
  - 場所: `app/routes/admin/notifications/index.tsx:85`
  - 修正: 全テナントメンバーシップの通知を集約表示するよう修正

### Warnings

- **[F-W-001]** `getStaffProfileByMemberId` に不要な `headers` が渡されている → 型上は正しく動作、修正不要
- **[F-W-002]** Platform routes が static import、他は dynamic import → 既存パターン、低リスク
- **[F-W-003]** admin/notifications の unreadCount が現在ページのみから計算 → 軽微、別タスク
- **[F-W-004]** platform routes で repository を直接呼び出し → platform 管理画面は特殊ケースとして許容
- **[F-W-005]** platform/users で raw transaction 使用 → 同上
- **[F-W-006]** スタッフプロフィール画像アップロードが未接続 → **修正済み**: 未実装の file input を削除

---

## バックエンド層

### Blockers

なし

### Warnings

- **[B-W-001]** NotificationFilter で `type` と `types` が同時設定可能 → 実用上問題なし（usecase 側で排他制御）
- **[B-W-002]** recipientType/type の unchecked cast → 既存プロジェクトパターン
- **[B-W-003]** typeFilters テスト未実装 → **修正済み**: 2テスト追加（配列フィルタ + 空配列）
- **[B-W-004]** 空配列の typeFilters が全件返す仕様 → ドキュメントで明確化が望ましい

---

## 品質ゲート結果

- typecheck: PASS
- lint: PASS (135 warnings, 全て pre-existing テストファイル内の noExplicitAny)
- format: PASS
- test: PASS (617 tests)

---

## 結論

認証・スタブ修正で発見された Blocker 2件は修正済み。残存 Warning は既存パターンまたは低リスクの改善提案で、別タスクとして対応可能。

**Verdict: APPROVED**
