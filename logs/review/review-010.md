# Code Review #10 — Frontend Design Fidelity Review

**Date:** 2026-03-23
**Scope:** Frontend implementation vs spec/design/ HTML mockups

---

## Summary

spec/design/pages/ のデザインHTMLと実装の比較レビューを実施。4グループ（管理画面・スタッフ画面・顧客/公開画面・プラットフォーム画面）で並列レビュー。

### 発見された根本原因

1. **CSSトークン全不一致** — `app/styles/index.css` の `@theme` がデザイントークン（tokens.md）と完全に異なるカラー・フォント・トークン体系だった
2. **レイアウト構造の差異** — ヘッダー欠落/簡略化、サイドバー幅不一致、ナビアイコン未実装、フッター欠落
3. **ハードコードTailwindクラス** — 管理画面17ファイルで `bg-blue-600`, `text-gray-*` 等のハードコード値が668箇所

### 修正内容

#### CSSトークン修正 (`app/styles/index.css`)
- `@theme` を tokens.md 準拠のOKLCH値に全面書き換え
- Primary (Sage Green): oklch(0.52 0.08 155)
- Secondary (Rose): 5段階追加
- Accent (Warm Gold): oklch(0.67 0.11 75) — 旧 #c27a6e（ピンク系）から修正
- Neutral: warm gray スケールに統一
- Semantic: success/warning/destructive/info
- Border Radius: --radius-sm/md/lg/xl 追加
- Font: Inter + Noto Sans JP に変更

#### フォント読み込み (`app/root.tsx`)
- Google Fonts リンク追加 (Inter + Noto Sans JP, weights 300-600)

#### レイアウトコンポーネント修正 (7ファイル)
- `Header.tsx`: ロゴ `dot.reservation` 分割表記、max-w-7xl
- `PublicLayout.tsx`: ロゴ修正、max-w-7xl
- `PlatformLayout.tsx`: サイドバー w-64、ロゴ修正、Heroiconsアイコン追加、active state bg-primary-lighter
- `admin/$tenantId/layout.tsx`: サイドバー w-64、9つのHeroiconsアイコン追加、active state修正、padding p-6 lg:p-8
- `staff/$tenantId/layout.tsx`: サイドバー w-64、6つのHeroiconsアイコン追加、active state修正、padding修正
- `StaffLayout.tsx`: 同上
- `CustomerLayout.tsx`: サイドバー w-60、4つのHeroiconsアイコン追加、active state修正、max-w-7xl

#### 管理画面ハードコードカラー置換 (17ファイル、668箇所)
- blue-* → primary/primary-dark
- gray-* → text/text-secondary/text-muted/border/surface-secondary
- red-* → destructive
- green-* → success
- yellow-* → warning
- purple-* → secondary-lighter/secondary-dark

### 残存する差異（今回未対応）

以下はデザインとの差異として認識しているが、構造的な大幅変更が必要なため今回は対応しない:

- **トップページ**: ヒーローグラデーション、おすすめ店舗セクション、CTAセクション未実装
- **検索ページ**: サイドバーフィルター（チェックボックス方式）未実装
- **パンくずリスト**: 全ページで未実装
- **ページサブタイトル**: 各ページタイトル下の補足文言未実装
- **メニュー管理**: テーブルレイアウト → デザインはカードレイアウト
- **シフト希望**: フラットリスト → デザインはカレンダーグリッド
- **スタッフダッシュボード**: テキストリスト → デザインはタイムライン表示
- **アバター表示**: テーブル行にアバター未表示
- **デスクトップヘッダー**: テキストリンク → デザインはアイコンボタン方式

---

## 品質ゲート結果

- typecheck: PASS
- lint: PASS (0 issues)
- format: PASS
- test: PASS (623 tests)

---

## Verdict: APPROVED (with known remaining gaps)

CSSトークン・カラー体系・フォント・レイアウト基盤は修正済み。
残存差異は構造的変更（カレンダーUI、カードレイアウト等）であり、別タスクとして対応推奨。
