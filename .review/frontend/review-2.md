# Frontend Review #2

**Date:** 2026-03-24
**Round:** 2回目

---

## Summary

- Blockers: 5
- Warnings: 13
- Verdict: **BLOCKED**

---

## Blockers

- **[B-001]** 店舗詳細ページのヒーローセクションがレスポンシブ未対応
  - 場所: `app/routes/shop.$urlPath/index.tsx:43`
  - 提案: Tailwind レスポンシブクラスに変更

- **[B-002]** EditConfirmStep の InfoBanner でハードコード OKLCH 値
  - 場所: `app/components/reservation/EditConfirmStep.tsx:97`
  - 提案: `var(--color-info-bg)` に変更

- **[B-003]** ShopTabs に WAI-ARIA Tabs 属性が欠落
  - 場所: `app/components/shop/ShopTabs.tsx:15-53`
  - 提案: role="tablist", role="tab", aria-selected, aria-controls 追加

- **[B-004]** MenuSection/StaffSection のグリッドがレスポンシブ未対応
  - 場所: `app/components/shop/MenuSection.tsx:244`, `app/components/shop/StaffSection.tsx:54`
  - 提案: Tailwind レスポンシブクラスに変更

- **[B-005]** ReservationDiffDisplay がデッドコード
  - 場所: `app/components/reservation/ReservationDiffDisplay.tsx`
  - 提案: 削除

## Warnings

- **[W-001]** search/loader.ts の limit=1000 パフォーマンス問題（既存）
- **[W-002]** リポジトリ直接アクセスの NOTE コメント（既存問題、Issue化推奨）
- **[W-003]** text-destructive, bg-destructive 等の非トークンクラス混在
- **[W-004]** TenantProfileForm/DeleteTenantSection の独立 fetcher パターン不統一
- **[W-005]** ImageManager の二重管理リスク
- **[W-006]** メンバー管理ページのスタイルが標準Tailwindのみ
- **[W-007]** divide-border クラスの border カラー未定義
- **[W-008]** WeekCalendar のホバーがJS実装
- **[W-009]** TimeSlotGrid の6カラム固定
- **[W-010]** カテゴリ選択オプションの重複定義
- **[W-011]** ReservationSummary のスタッフ名未表示
- **[W-012]** MonthCalendar の凡例と実際の表示の不一致
- **[W-013]** presetStaffId のステップスキップ未実装
