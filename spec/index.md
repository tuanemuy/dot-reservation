# 設計

## ドキュメント構成

- [初期アイデア](./idea.md)
- [利用シナリオ](./scenario/index.md) ✓
- [ページ設計](./pages/index.md) ✓
- [ドメイン設計](./domains/index.md) ✓
  - [Auth（認証基盤）](./domains/auth.md) — better-auth による認証・セッション管理（アカウント共有モデル）
- [ユースケース設計](./usecases/) ✓
  - [Auth 統合](./usecases/auth.md) — 既存ユースケースへの認証統合、cleanupAuthUserIfOrphaned
- [DB設計](./database/index.md) ✓
- [テストケース](./testcases/) ✓
  - [Auth テストケース](./testcases/auth/) — セッション検証、認証統合、cleanupAuthUserIfOrphaned
- [UIデザイン](./design/index.md) ✓
  - [デザイントークン](./design/tokens.md)
  - [ドラフト](./design/drafts/) (6案)
  - [全画面デザイン](./design/pages/) (57画面)
  - [レビュー記録](./design/review/) (3ラウンド)

## ADR（Architecture Decision Records）

- [ADR-001](./adr/001-better-auth-as-auth-adapter.md) — better-auth を認証アダプターとして採用
- [ADR-002](./adr/002-separate-customer-member-auth.md) — 顧客とメンバーの認証アカウント共有

## クロスフェーズ検証

- [Auth ドメイン追加検証](./review/cross-phase/001.md) ✓
- [認証アカウント共有モデル検証](./review/cross-phase/002.md) ✓
