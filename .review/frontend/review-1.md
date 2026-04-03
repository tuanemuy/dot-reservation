# Frontend Review #1

**Date:** 2026-03-24
**Round:** 1回目

---

## Summary

- Blockers: 4
- Warnings: 14
- Verdict: **BLOCKED**

---

## Blockers

- **[B-001]** `WeekCalendar` が未定義のCSSカスタムプロパティを `style` 属性で参照
  - 場所: `app/components/reservation/WeekCalendar.tsx:243-360`
  - 理由: `var(--color-border)`, `var(--color-surface)` 等は `@theme` 内のみで定義され、`:root` に出力されないため `style` 属性では解決されない
  - 提案: `:root` で定義されたトークンに置換（例: `var(--color-neutral-300)`）

- **[B-002]** `ReservationDiffDisplay` が他コンポーネントと異なるカラーシステムを使用
  - 場所: `app/components/reservation/ReservationDiffDisplay.tsx:20-55`
  - 理由: `text-text`, `bg-surface` 等のエイリアスクラスを使用し、他コンポーネントの `text-neutral-xxx` パターンと一貫性がない
  - 提案: デザイントークンに統一

- **[B-003]** `mypage/reservations/$id/edit/index.tsx` が依然として600行超
  - 場所: `app/routes/mypage/reservations/$id/edit/index.tsx:1-651`
  - 理由: 日付選択UI・時間スロットUI・確認画面がインラインのまま。予約ページで切り出した共通コンポーネントが再利用されていない
  - 提案: コンポーネント化を追加実施

- **[B-004]** `search/loader.ts` がカテゴリ取得のために全テナント(limit:1000)を取得
  - 場所: `app/routes/search/loader.ts:38-53`
  - 理由: パフォーマンス問題（リファクタリング前からの既存問題）
  - 提案: 専用ユースケース追加が理想だが、フロントエンドリファクタリングのスコープ外。コメントで注記のみ

## Warnings

- **[W-001]** `StepIndicator` が `reservation/` と `tenant/` で別々に実装
- **[W-002]** `ModalCloseButton` が `shop/MenuDetailModal.tsx` と `shop/StaffDetailModal.tsx` で重複
- **[W-003]** shop のモーダルが `ui/Modal` を使わず独自overlay実装
- **[W-004]** `admin/$tenantId/members/` のタブが `ui/Tabs` 未使用
- **[W-005]** `shop.$urlPath/loader.ts` に action も含まれている
- **[W-006]** `cardStyle`/`cardTitleStyle` が customer の2ファイルで重複
- **[W-007]** `roleLabels` が member の2ファイルで重複
- **[W-008]** `platform/users/$userId/loader.ts` がリポジトリ直接アクセス
- **[W-009]** `platform/tenants/$tenantId/loader.ts` がリポジトリ直接アクセス
- **[W-010]** `mypage/profile/loader.ts` がリポジトリ直接アクセス
- **[W-011]** container のインポート方式が不統一（静的/動的）
- **[W-012]** `inputClass`/`labelClass` が tenant の4ファイルで重複
- **[W-013]** 予約・検索ページのレスポンシブ対応不足
- **[W-014]** `ConfirmStep` の `onComplete` による無限ループリスク
