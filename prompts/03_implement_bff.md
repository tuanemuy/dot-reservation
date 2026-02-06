# BFFの実装を行う

## 背景

- `spec/index.md` に設計を行った
- `spec/pages.md` にページ構成とその詳細を記載した
- `spec/pages.list.tsv` に実装すべきページをリスト化した
- `spec/usecases.tsv` にユースケースをリスト化した
- `docs/frontend_implementation_example.md` にフロントエンド実装の例を記載した
- バックエンド実装が完了している
- フロントエンド実装が完了している

## タスク

- 設計に従ってloaderやactionなどのBFFを実装し、UIと統合する

## ワークフロー

1. `spec/pages.list.tsv` で未実装のページを確認する
2. `spec/page.md` でページの詳細を確認する
3. ページを実装する
4. 型チェックとリンターを実行し、問題がなくなるまで修正を続ける
5. `spec/pages.list.tsv` を更新して進捗を記録する

## 条件

- 重要なデータ以外は非同期で取得、描画を行う
- 可能な限りuseEffectやuseLayoutEffectを使わない
