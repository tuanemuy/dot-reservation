# デザイントークン

## カラー

### Primary (Sage Green)

ブランドカラー。CTA、アクティブ状態、リンク、ナビゲーション要素に使用。

| Token | OKLCH | HEX | 用途 |
|-------|-------|-----|------|
| `--color-primary-lighter` | `oklch(0.96 0.02 155)` | #EDF5EF | バッジ背景、選択状態の背景 |
| `--color-primary-light` | `oklch(0.78 0.06 155)` | #A3C5A8 | ホバー背景、薄いアクセント |
| `--color-primary` | `oklch(0.52 0.08 155)` | #4A7C59 | CTA、リンク、アクティブタブ |
| `--color-primary-dark` | `oklch(0.45 0.07 155)` | #3D6A4B | ホバー時のCTA |
| `--color-primary-darker` | `oklch(0.36 0.06 155)` | #2E5138 | 押下時 |

### Secondary (Rose)

補助カラー。バッジ、タグ、アバター背景、強調表示に使用。

| Token | OKLCH | HEX | 用途 |
|-------|-------|-----|------|
| `--color-secondary-lighter` | `oklch(0.96 0.02 350)` | #FDF0F4 | バッジ背景 |
| `--color-secondary-light` | `oklch(0.84 0.06 350)` | #F0C4D6 | アバター背景 |
| `--color-secondary` | `oklch(0.65 0.12 350)` | #D4789C | バッジテキスト、アイコン |
| `--color-secondary-dark` | `oklch(0.52 0.12 350)` | #B44D75 | 強調テキスト |
| `--color-secondary-darker` | `oklch(0.40 0.12 350)` | #8C3658 | — |

### Accent (Warm Gold)

アクセントカラー。価格、通知、ハイライト、特別な要素に使用。

| Token | OKLCH | HEX | 用途 |
|-------|-------|-----|------|
| `--color-accent-lighter` | `oklch(0.97 0.02 75)` | #FBF5EB | ハイライト背景 |
| `--color-accent-light` | `oklch(0.84 0.08 75)` | #E8C88A | 薄いアクセント |
| `--color-accent` | `oklch(0.67 0.11 75)` | #C4954A | 価格、通知ドット |
| `--color-accent-dark` | `oklch(0.53 0.10 75)` | #9A7330 | バッジテキスト |
| `--color-accent-darker` | `oklch(0.43 0.09 75)` | #7A5B24 | — |

### Neutral

テキスト、背景、ボーダーなどの汎用カラー。

| Token | OKLCH | HEX | 用途 |
|-------|-------|-----|------|
| `--color-neutral-50` | `oklch(0.99 0.002 80)` | #FDFCFB | ページ背景(alt) |
| `--color-neutral-100` | `oklch(0.97 0.004 80)` | #F8F7F5 | セクション背景 |
| `--color-neutral-200` | `oklch(0.94 0.005 80)` | #EEEDEB | カード背景(alt) |
| `--color-neutral-300` | `oklch(0.88 0.006 80)` | #DDDBD8 | ボーダー(軽) |
| `--color-neutral-400` | `oklch(0.78 0.006 80)` | #B8B5B1 | プレースホルダー |
| `--color-neutral-500` | `oklch(0.65 0.006 80)` | #8E8B87 | 補助テキスト |
| `--color-neutral-600` | `oklch(0.55 0.006 80)` | #6E6B67 | セカンダリテキスト |
| `--color-neutral-700` | `oklch(0.45 0.006 80)` | #504E4B | ボディテキスト |
| `--color-neutral-800` | `oklch(0.35 0.006 80)` | #373533 | 見出しテキスト |
| `--color-neutral-900` | `oklch(0.25 0.006 80)` | #1F1E1D | 最も濃いテキスト |

### Semantic

| Token | OKLCH | HEX | 用途 |
|-------|-------|-----|------|
| `--color-success` | `oklch(0.55 0.12 145)` | #3D8B47 | 成功、確定ステータス |
| `--color-warning` | `oklch(0.72 0.14 70)` | #D4960A | 警告、承認待ち |
| `--color-error` | `oklch(0.55 0.16 25)` | #C53030 | エラー、キャンセル |
| `--color-info` | `oklch(0.55 0.10 240)` | #2B6CB0 | 情報、ヒント |

### Background

| Token | 参照先 | 用途 |
|-------|--------|------|
| `--color-bg-page` | `#FFFFFF` | ページ背景 |
| `--color-bg-card` | `#FFFFFF` | カード背景 |
| `--color-bg-section` | `var(--color-neutral-100)` | セクション背景 |
| `--color-bg-elevated` | `#FFFFFF` | モーダル、ドロップダウン |

---

## タイポグラフィ

### Font Family

| Token | 値 | 用途 |
|-------|-----|------|
| `--font-heading` | `'Inter', 'Noto Sans JP', system-ui, sans-serif` | 見出し |
| `--font-body` | `'Inter', 'Noto Sans JP', system-ui, sans-serif` | 本文 |

### Font Size Scale

| Token | 値 | 用途 |
|-------|-----|------|
| `--text-xs` | `clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)` | ラベル、注釈 (11-12px) |
| `--text-sm` | `clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)` | メタ情報、バッジ (12-13px) |
| `--text-base` | `clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)` | 本文 (13-15px) |
| `--text-lg` | `clamp(0.9375rem, 0.85rem + 0.25vw, 1.0625rem)` | 強調本文 (15-17px) |
| `--text-xl` | `clamp(1.125rem, 1rem + 0.3vw, 1.25rem)` | セクション見出し (18-20px) |
| `--text-2xl` | `clamp(1.375rem, 1.2rem + 0.5vw, 1.625rem)` | ページ見出し (22-26px) |
| `--text-3xl` | `clamp(1.75rem, 1.5rem + 0.7vw, 2.125rem)` | ヒーロー見出し (28-34px) |

### Font Weight

| Token | 値 | 用途 |
|-------|-----|------|
| `--weight-light` | `300` | サブテキスト、キャッチコピー |
| `--weight-normal` | `400` | 本文 |
| `--weight-medium` | `500` | ラベル、ボタン、強調 |
| `--weight-semibold` | `600` | 見出し、価格 |

### Line Height / Letter Spacing

| Token | 値 | 用途 |
|-------|-----|------|
| `--leading-tight` | `1.3` | 見出し |
| `--leading-normal` | `1.7` | 本文 |
| `--leading-relaxed` | `1.9` | 長文、説明文 |
| `--tracking-tight` | `-0.02em` | 見出し |
| `--tracking-normal` | `0` | 本文 |
| `--tracking-wide` | `0.04em` | ラベル、大文字テキスト |

---

## スペーシング

Base unit: `4px`

| Token | 値 | px相当 |
|-------|-----|--------|
| `--space-xs` | `0.25rem` | 4px |
| `--space-sm` | `0.5rem` | 8px |
| `--space-md` | `1rem` | 16px |
| `--space-lg` | `1.5rem` | 24px |
| `--space-xl` | `2rem` | 32px |
| `--space-2xl` | `2.5rem` | 40px |
| `--space-3xl` | `3.5rem` | 56px |
| `--space-section` | `5rem` | 80px |

---

## Border Radius

| Token | 値 | 用途 |
|-------|-----|------|
| `--radius-sm` | `6px` | バッジ、小タグ |
| `--radius-md` | `10px` | ボタン、入力フィールド |
| `--radius-lg` | `14px` | カード |
| `--radius-xl` | `16px` | 画像、大きなコンテナ |
| `--radius-full` | `9999px` | アバター、ピル型バッジ |

## Shadow

| Token | 値 | 用途 |
|-------|-----|------|
| `--shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.04)` | ホバー時のカード |
| `--shadow-md` | `0 2px 8px oklch(0 0 0 / 0.06)` | ドロップダウン、ポップオーバー |
| `--shadow-lg` | `0 4px 16px oklch(0 0 0 / 0.08)` | モーダル |

## Transition

| Token | 値 | 用途 |
|-------|-----|------|
| `--transition-fast` | `0.1s ease` | ボタン押下 |
| `--transition-default` | `0.15s ease` | ホバー、フォーカス |
| `--transition-slow` | `0.25s ease` | パネル開閉 |

---

## CSS カスタムプロパティ

全画面で以下の `:root` 定義を共有する:

```css
:root {
  /* Primary (Sage Green) */
  --color-primary-lighter: oklch(0.96 0.02 155);
  --color-primary-light: oklch(0.78 0.06 155);
  --color-primary: oklch(0.52 0.08 155);
  --color-primary-dark: oklch(0.45 0.07 155);
  --color-primary-darker: oklch(0.36 0.06 155);

  /* Secondary (Rose) */
  --color-secondary-lighter: oklch(0.96 0.02 350);
  --color-secondary-light: oklch(0.84 0.06 350);
  --color-secondary: oklch(0.65 0.12 350);
  --color-secondary-dark: oklch(0.52 0.12 350);
  --color-secondary-darker: oklch(0.40 0.12 350);

  /* Accent (Warm Gold) */
  --color-accent-lighter: oklch(0.97 0.02 75);
  --color-accent-light: oklch(0.84 0.08 75);
  --color-accent: oklch(0.67 0.11 75);
  --color-accent-dark: oklch(0.53 0.10 75);
  --color-accent-darker: oklch(0.43 0.09 75);

  /* Neutral */
  --color-neutral-50: oklch(0.99 0.002 80);
  --color-neutral-100: oklch(0.97 0.004 80);
  --color-neutral-200: oklch(0.94 0.005 80);
  --color-neutral-300: oklch(0.88 0.006 80);
  --color-neutral-400: oklch(0.78 0.006 80);
  --color-neutral-500: oklch(0.65 0.006 80);
  --color-neutral-600: oklch(0.55 0.006 80);
  --color-neutral-700: oklch(0.45 0.006 80);
  --color-neutral-800: oklch(0.35 0.006 80);
  --color-neutral-900: oklch(0.25 0.006 80);

  /* Semantic */
  --color-success: oklch(0.55 0.12 145);
  --color-warning: oklch(0.72 0.14 70);
  --color-error: oklch(0.55 0.16 25);
  --color-info: oklch(0.55 0.10 240);

  /* Background */
  --color-bg-page: #FFFFFF;
  --color-bg-card: #FFFFFF;
  --color-bg-section: var(--color-neutral-100);
  --color-bg-elevated: #FFFFFF;

  /* Typography */
  --font-heading: 'Inter', 'Noto Sans JP', system-ui, sans-serif;
  --font-body: 'Inter', 'Noto Sans JP', system-ui, sans-serif;
  --text-xs: clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem);
  --text-sm: clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem);
  --text-base: clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem);
  --text-lg: clamp(0.9375rem, 0.85rem + 0.25vw, 1.0625rem);
  --text-xl: clamp(1.125rem, 1rem + 0.3vw, 1.25rem);
  --text-2xl: clamp(1.375rem, 1.2rem + 0.5vw, 1.625rem);
  --text-3xl: clamp(1.75rem, 1.5rem + 0.7vw, 2.125rem);
  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --leading-tight: 1.3;
  --leading-normal: 1.7;
  --leading-relaxed: 1.9;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.04em;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 2.5rem;
  --space-3xl: 3.5rem;
  --space-section: 5rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-md: 0 2px 8px oklch(0 0 0 / 0.06);
  --shadow-lg: 0 4px 16px oklch(0 0 0 / 0.08);

  /* Transition */
  --transition-fast: 0.1s ease;
  --transition-default: 0.15s ease;
  --transition-slow: 0.25s ease;
}
```
