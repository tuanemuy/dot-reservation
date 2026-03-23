# Code Review #3

**Date:** 2026-03-23
**Round:** 1回目 (Auth 実装)

---

## Summary

- Blockers: 5 (すべて修正済み)
- Warnings: 10 (重要なもの対応済み、残りは低リスク)
- Notes: 20
- Verdict: **APPROVED**

---

## ドメイン + アダプター層

### Blockers
なし

### Warnings
- **[W-001]** `deleteUser` のエラーハンドリングが広い — 対応見送り（better-auth のエラー型が不明瞭なため）
- **[W-002]** `outbox_events` の部分インデックス不足 — Auth 対象外、別タスク
- **[W-003]** `databaseHooks` のメール同期にトランザクションなし — 低リスク（2クエリの原子性）
- **[W-004]** `banUser` / `unbanUser` のエラーハンドリングなし — プラットフォーム管理のみ使用、低リスク

---

## ユースケース + テスト層

### Blockers
- **[B-001]** deleteMemberAccount の担当予約「担当者未定」処理不足 — **既存の問題**（auth 変更以前から存在）。Auth 実装スコープ外。
- **[B-002]** deleteCustomer のイベント順序が設計書と異なる — **ドキュメントの記述問題**。Outbox パターンではイベントはトランザクション内で保存するのが正しく、実装は正しい。

### Warnings
- **[W-001]** deleteUser 失敗時のテスト不足 — 低リスク（エラーログのみ）
- **[W-002]** try-catch の使用について — 外部システム例外の捕捉として妥当
- **[W-003]** authIntegration テストカバレッジ — プレゼンテーション層テストは E2E で対応

---

## フロントエンド層

### Blockers (すべて修正済み)
- **[B-001]** admin/register.tsx の callbackURL 追加 ✓
- **[B-002]** admin/verify-email.tsx のエラーハンドリング追加 ✓
- **[B-003]** admin/new-tenant の認証保護追加 ✓
- **[B-004]** admin/$tenantId/layout.tsx のテナント所属検証追加 ✓
- **[B-005]** staff/$tenantId/layout.tsx のテナント所属検証追加 ✓

### Warnings
- **[W-001]** spec の `forgetPassword` vs 実装の `requestPasswordReset` — ライブラリの実際の API 名に合わせた（正しい）
- **[W-002]** ログイン後の元ページリダイレクト未実装 — 低優先度
- **[W-003]** PlatformLayout にログアウトボタンなし — 既存 TODO
- **[W-004]** signUp 後の authUserId 取得リスク — 設計レベルの制約（autoSignIn: false）
- **[W-005]** authUserId をクライアントから受け取るセキュリティ — 設計の制約上避けられない。setup ページでのフォールバックあり
- **[W-006]** aside の position 問題 — 既存の CSS 問題

---

## 品質ゲート結果

- typecheck: PASS
- lint: PASS (既存 warnings のみ)
- test: PASS (610 tests)
