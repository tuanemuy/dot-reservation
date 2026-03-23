# Auth ドメイン（認証基盤）

## 概要

認証・セッション管理を担当するインフラストラクチャ層。better-auth ライブラリをアダプターとして利用する。
ドメイン層は AuthProvider ポートを通じて認証機能にアクセスし、フロントエンドは better-auth クライアント SDK を直接利用する。

認証はドメイン駆動設計における「ドメイン」ではなく、横断的関心事（cross-cutting concern）として位置づける。

## ユビキタス言語

| 用語 | 定義 |
|---|---|
| 認証ユーザー（AuthUser） | better-auth が管理するユーザーレコード。各ドメインの authUserId でリンクする |
| セッション（AuthSession） | ログイン中のセッション。Cookie ベースのトークンで管理される |
| 認証ユーザーID（AuthUserId） | better-auth ユーザーの一意識別子。Customer.authUserId / Member.authUserId に対応 |
| メール確認（Email Verification） | ユーザー登録時にメールアドレスの所有を確認するプロセス |

## 認証アカウント共有モデル

1つの better-auth ユーザー（1つのメールアドレス）で、Customer エンティティと Member エンティティの**両方を持てる**。

- ユーザー種別はドメインエンティティの存在で判別する（better-auth の role ではない）
- ログインは共通セッション。アクセスする URL パス（`/customer/*` vs `/admin/*`）でコンテキストが決まる
- 詳細は [ADR-002](../adr/002-separate-customer-member-auth.md) を参照

## 認証フロー

### ユーザー登録（サインアップ）

顧客登録とメンバー登録は別々のページで行われるが、認証基盤としては同一の better-auth インスタンスを使用する。

**初回登録フロー（auth ユーザーが未作成の場合）:**
1. フロントエンドが `authClient.signUp.email({ name, email, password })` を呼び出す
2. better-auth がユーザーレコードを作成し、確認メールを送信する
3. フロントエンドが成功コールバックで、ドメインエンティティ作成ユースケースを呼び出す
   - 顧客登録ページ: `createCustomer(authUserId, displayName, email)`
   - メンバー登録ページ: `createMemberAccount(authUserId, name, email)`
4. ユーザーはメール確認リンクをクリック → 確認完了ページ → ログインページ

**クロス登録フロー（auth ユーザーが既に存在する場合）:**
1. フロントエンドが `authClient.signUp.email(...)` を呼び出す → 「メールアドレスは既に登録済みです」エラー
2. フロントエンドがエラーを検知し、「このメールアドレスは既に登録されています。ログインしてください。」とメッセージを表示する
3. ユーザーがログインページに移動し、ログインする
4. ログイン後、ルートの loader がドメインエンティティの存在を確認する
5. ドメインエンティティが存在しない → プロフィール作成ページにリダイレクトする
6. プロフィール作成ページで必要情報を入力 → ドメインエンティティ作成ユースケースを呼び出す
   - 顧客プロフィール作成: `createCustomer(authUserId, displayName, email)`
   - メンバープロフィール作成: `createMemberAccount(authUserId, name, email)`

**障害時のリカバリ:**
- 初回登録のステップ 2 成功後にステップ 3 が失敗した場合、auth ユーザーは存在するがドメインエンティティが未作成の状態になる
- この場合、ユーザーは再ログイン後にドメインエンティティ作成をリトライできる（クロス登録フローと同じ動き）

### ログイン（サインイン）

1. フロントエンドが `authClient.signIn.email({ email, password })` を呼び出す
2. better-auth がセッションを作成し、Cookie にセッショントークンを設定する
3. 以降のリクエストは Cookie に含まれるトークンで認証される

**ログイン後のルーティング:**
- 顧客ログイン: Customer エンティティの存在確認 → 存在しない場合はプロフィール作成ページ、存在する場合はマイページへ
- メンバーログイン: Member エンティティの存在確認 → 存在しない場合はプロフィール作成ページ、存在する場合はテナント選択 or ダッシュボードへ
- プラットフォーム管理者ログイン: `user.role === "admin"` を確認 → 管理ダッシュボードへ

### セッション検証

すべての認証が必要なルートで以下のパターンを使用する:

1. loader/action で `container.authProvider.getSession(request.headers)` を呼び出す
2. セッションが null → 未認証。ログインページへリダイレクト
3. セッションが有効 → `authUser.id` を使って対応するドメインエンティティを取得
4. ドメインエンティティが存在しない → プロフィール作成ページへリダイレクト
5. ドメインエンティティの状態を確認（停止中でないか等）

### ログアウト（サインアウト）

1. フロントエンドが `authClient.signOut()` を呼び出す
2. better-auth がサーバー側のセッションを無効化し、Cookie を削除する
3. ログインページにリダイレクトする

### パスワードリセット

1. フロントエンドが `authClient.forgetPassword({ email, redirectTo })` を呼び出す
2. better-auth がリセットメールを送信する（登録済みかどうかに関わらず同じレスポンス）
3. リセットリンクの有効期限は 1 時間
4. ユーザーがリセットリンクをクリック → パスワード再設定ページに遷移
5. フロントエンドが `authClient.resetPassword({ newPassword, token })` を呼び出す

### パスワード変更

1. ログイン中のユーザーが `authClient.changePassword({ currentPassword, newPassword })` を呼び出す
2. better-auth が現在のパスワードを検証し、新しいパスワードに更新する

### メールアドレス変更

1. ログイン中のユーザーが `authClient.changeEmail({ newEmail })` を呼び出す
2. better-auth が新しいメールアドレスに確認メールを送信する
3. 確認完了後、better-auth がユーザーのメールを更新する
4. better-auth の databaseHooks でドメインエンティティ（Customer / Member）のメールも連動して更新する

## 停止・BAN の設計

### 顧客の停止（ドメインレベル）

顧客の停止は **Customer.status** で管理する。better-auth の BAN は使用しない。

- `suspendCustomer`: Customer.status を "suspended" に変更するのみ
- `reactivateCustomer`: Customer.status を "active" に変更するのみ
- 顧客ページの loader で Customer.status === "suspended" をチェックし、停止中ならエラーページを表示する
- **メンバーとしてのアクセスは影響を受けない**（同一 auth ユーザーでもメンバー側は正常に利用可能）

### プラットフォームレベルの BAN（auth レベル）

プラットフォーム管理者がユーザーを完全にブロックする場合に、better-auth の BAN を使用する。

- `authProvider.banUser()`: auth ユーザーを BAN → 全セッション無効化 → 全サービスでログイン不可
- **顧客としてもメンバーとしてもアクセス不可**になる
- この操作はプラットフォーム管理者の明示的な操作でのみ実行される

## 型定義

### AuthUser

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 認証ユーザーID |
| email | string | メールアドレス |
| name | string | 表示名 |
| emailVerified | boolean | メール確認済みか |
| role | string | ロール（"user" \| "admin"） |
| banned | boolean | BAN状態か |
| banReason | string \| null | BAN理由 |
| banExpires | Date \| null | BAN解除日時（null = 無期限） |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### AuthSession

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | セッションID |
| userId | string | ユーザーID |
| token | string | セッショントークン |
| expiresAt | Date | 有効期限 |
| ipAddress | string \| null | IPアドレス |
| userAgent | string \| null | ユーザーエージェント |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

## ポート

### AuthProvider

アプリケーション層が認証基盤にアクセスするためのインターフェース。

- `getSession(headers: Headers): Promise<{ user: AuthUser; session: AuthSession } | null>` — リクエストヘッダーの Cookie からセッションを検証し、有効であればユーザー情報とセッション情報を返す。無効または期限切れの場合は null
- `deleteUser(userId: string): Promise<void>` — 認証ユーザーを削除する。関連するセッション・アカウント情報も全て削除される
- `banUser(userId: string, reason?: string): Promise<void>` — ユーザーを BAN する。既存のセッションも全て無効化され、以降のログインが拒否される。プラットフォームレベルのブロックに使用
- `unbanUser(userId: string): Promise<void>` — BAN を解除する

### AuthEmailSender

認証関連のメール送信インターフェース。better-auth の設定オプションとして注入する。

- `sendVerificationEmail(params: { user: { id: string; email: string; name: string }; url: string }): Promise<void>` — メール確認メールを送信する。`url` は確認用リンク
- `sendPasswordResetEmail(params: { user: { id: string; email: string; name: string }; url: string }): Promise<void>` — パスワードリセットメールを送信する。`url` はリセット用リンク

## better-auth 設定

### 使用プラグイン

| プラグイン | 目的 |
|---|---|
| admin | プラットフォーム管理者のユーザー管理（BAN/解除、ユーザー一覧取得）。ユーザーテーブルに `role`, `banned`, `banReason`, `banExpires` フィールドを追加 |

### 主要設定

| 設定項目 | 値 | 説明 |
|---|---|---|
| emailAndPassword.enabled | true | メール + パスワード認証を有効化 |
| emailAndPassword.requireEmailVerification | true | ログイン前にメール確認を必須にする |
| emailAndPassword.autoSignIn | false | 登録後に自動ログインしない（メール確認を促す） |
| emailAndPassword.minPasswordLength | 8 | パスワード最小文字数 |
| emailAndPassword.maxPasswordLength | 128 | パスワード最大文字数 |
| emailAndPassword.sendResetPassword | (実装) | パスワードリセットメール送信関数 |
| emailVerification.sendVerificationEmail | (実装) | メール確認メール送信関数 |
| admin.defaultRole | "user" | 新規ユーザーのデフォルトロール |
| admin.adminRoles | ["admin"] | 管理者権限を持つロール |

### ルーティング

better-auth の HTTP ハンドラを React Router v7 のキャッチオールルートにマウントする。

**マウントポイント:** `app/routes/api.auth.$.ts`

```
POST /api/auth/sign-up/email     — ユーザー登録
POST /api/auth/sign-in/email     — ログイン
POST /api/auth/sign-out          — ログアウト
GET  /api/auth/get-session       — セッション取得
POST /api/auth/forget-password   — パスワードリセットメール送信
POST /api/auth/reset-password    — パスワード再設定
POST /api/auth/change-password   — パスワード変更
POST /api/auth/change-email      — メールアドレス変更
GET  /api/auth/verify-email      — メール確認
```

### Drizzle ORM アダプター

```
database: drizzleAdapter(db, {
  provider: "sqlite",
  usePlural: true,  // テーブル名を複数形にする（users, sessions, accounts, verifications）
})
```

### データベースフック

```
databaseHooks: {
  user: {
    update: {
      after: async (user) => {
        // メールアドレス変更時にドメインエンティティのメールも更新
        // Customer.email を user.email に同期（Customer が存在する場合）
        // Member.email を user.email に同期（Member が存在する場合）
      }
    }
  }
}
```

## 既存ドメインとの統合

### Customer ドメイン

| 操作 | 統合内容 |
|---|---|
| 顧客登録（新規） | `authClient.signUp` → `createCustomer(authUserId, ...)` |
| 顧客登録（クロス登録） | ログイン後、Customer 未作成なら → プロフィール作成ページ → `createCustomer(authUserId, ...)` |
| 顧客ログイン | `authClient.signIn` → セッション取得 → `findByAuthUserId(authUserId)` |
| アカウント削除 | `deleteCustomer` → Customer エンティティ削除 → `cleanupAuthUserIfOrphaned` |
| アカウント停止 | `suspendCustomer` → Customer.status を "suspended" に変更（auth BAN は使用しない） |
| アカウント再開 | `reactivateCustomer` → Customer.status を "active" に変更 |
| メール変更 | better-auth の databaseHooks で Customer.email を同期 |

### Member ドメイン

| 操作 | 統合内容 |
|---|---|
| メンバー登録（新規） | `authClient.signUp` → `createMemberAccount(authUserId, ...)` |
| メンバー登録（クロス登録） | ログイン後、Member 未作成なら → プロフィール作成ページ → `createMemberAccount(authUserId, ...)` |
| メンバーログイン | `authClient.signIn` → セッション取得 → `findByAuthUserId(authUserId)` |
| アカウント削除 | `deleteMemberAccount` → Member エンティティ削除 → `cleanupAuthUserIfOrphaned` |
| メール変更 | better-auth の databaseHooks で Member.email を同期 |

### プラットフォーム管理者

| 操作 | 統合内容 |
|---|---|
| 管理者ログイン | `authClient.signIn` → セッション取得 → `user.role === "admin"` を確認 |
| 管理者作成 | システム側でシードスクリプトにより事前作成。`role = "admin"` を設定 |
| ユーザー BAN | `authProvider.banUser()` — 全サービスでのアクセスをブロック |
| ユーザー BAN 解除 | `authProvider.unbanUser()` |

## ユースケース（概要）

### cleanupAuthUserIfOrphaned — auth ユーザーの条件付き削除

Customer または Member のアカウント削除後に呼び出す。auth ユーザーに紐づくドメインエンティティが一つも存在しない場合にのみ、auth ユーザーを削除する。

- **入力**: authUserId（string）
- **処理フロー**:
  1. `customerRepository.findByAuthUserId(authUserId)` で Customer の存在を確認する
  2. `memberRepository.findByAuthUserId(authUserId)` で Member の存在を確認する
  3. 両方とも存在しない場合、`authProvider.deleteUser(authUserId)` で auth ユーザーを削除する
  4. いずれかが存在する場合、何もしない

その他の既存ユースケースへの AuthProvider ポート呼び出し変更は [usecases/auth.md](../usecases/auth.md) を参照。
