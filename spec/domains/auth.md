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

## 認証フロー

### ユーザー登録（サインアップ）

顧客登録とメンバー登録は別々のページで行われるが、認証基盤としては同一の better-auth インスタンスを使用する。

**顧客登録フロー:**
1. フロントエンドが `authClient.signUp.email({ name, email, password })` を呼び出す
2. better-auth がユーザーレコードを作成し、確認メールを送信する
3. フロントエンドが成功コールバックで `createCustomer` ユースケースを呼び出す（authUserId, displayName, email を渡す）
4. ユーザーはメール確認リンクをクリック → 確認完了ページ → ログインページ

**メンバー登録フロー:**
1. フロントエンドが `authClient.signUp.email({ name, email, password })` を呼び出す
2. better-auth がユーザーレコードを作成し、確認メールを送信する
3. フロントエンドが成功コールバックで `createMemberAccount` ユースケースを呼び出す（authUserId, name, email を渡す）
4. ユーザーはメール確認リンクをクリック → 確認完了ページ → 管理画面ログインページ

**障害時のリカバリ:**
- ステップ 2 成功後にステップ 3 が失敗した場合、auth ユーザーは存在するがドメインエンティティが未作成の状態になる
- この場合、ユーザーは再ログイン後にドメインエンティティ作成をリトライできる
- ルートの loader でセッションは有効だが対応するドメインエンティティが見つからない場合、エンティティ作成ページにリダイレクトする

### ログイン（サインイン）

1. フロントエンドが `authClient.signIn.email({ email, password })` を呼び出す
2. better-auth がセッションを作成し、Cookie にセッショントークンを設定する
3. 以降のリクエストは Cookie に含まれるトークンで認証される

**ログイン後のルーティング:**
- 顧客ログイン: ドメインエンティティ（Customer）の存在確認 → マイページへ
- メンバーログイン: ドメインエンティティ（Member）の存在確認 → テナント選択 or ダッシュボードへ
- プラットフォーム管理者ログイン: `user.role === "admin"` を確認 → 管理ダッシュボードへ

### セッション検証

すべての認証が必要なルートで以下のパターンを使用する:

1. loader/action で `container.authProvider.getSession(request.headers)` を呼び出す
2. セッションが null → 未認証。ログインページへリダイレクト
3. セッションが有効 → `authUser.id` を使って対応するドメインエンティティを取得
4. ドメインエンティティが存在しない → エラーまたはリダイレクト
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
- `banUser(userId: string, reason?: string): Promise<void>` — ユーザーを BAN する。既存のセッションも全て無効化され、以降のログインが拒否される
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
        // Customer.email, Member.email を user.email に同期
      }
    }
  }
}
```

## 既存ドメインとの統合

### Customer ドメイン

| 操作 | 統合内容 |
|---|---|
| 顧客登録 | `authClient.signUp` → `createCustomer(authUserId, ...)` |
| 顧客ログイン | `authClient.signIn` → セッション取得 → `findByAuthUserId(authUserId)` |
| アカウント削除 | `deleteCustomer` 内で `authProvider.deleteUser(authUserId)` を呼び出す |
| アカウント停止 | `suspendCustomer` 内で `authProvider.banUser(authUserId, reason)` を呼び出す |
| アカウント再開 | `reactivateCustomer` 内で `authProvider.unbanUser(authUserId)` を呼び出す |
| メール変更 | better-auth の databaseHooks で Customer.email を同期 |

### Member ドメイン

| 操作 | 統合内容 |
|---|---|
| メンバー登録 | `authClient.signUp` → `createMemberAccount(authUserId, ...)` |
| メンバーログイン | `authClient.signIn` → セッション取得 → `findByAuthUserId(authUserId)` |
| アカウント削除 | `deleteMemberAccount` 内で `authProvider.deleteUser(authUserId)` を呼び出す |
| メール変更 | better-auth の databaseHooks で Member.email を同期 |

### プラットフォーム管理者

| 操作 | 統合内容 |
|---|---|
| 管理者ログイン | `authClient.signIn` → セッション取得 → `user.role === "admin"` を確認 |
| 管理者作成 | システム側でシードスクリプトにより事前作成。`role = "admin"` を設定 |
| 顧客停止 | `suspendCustomer` → `authProvider.banUser()` |
| 顧客再開 | `reactivateCustomer` → `authProvider.unbanUser()` |

## ユースケース（概要）

Auth 固有のユースケースは定義しない。認証操作は better-auth が直接ハンドリングし、ドメインエンティティの操作は既存の各ドメインのユースケースが担当する。

ただし、以下の既存ユースケースに AuthProvider ポートの呼び出しを追加する:

- `deleteCustomer` — `authProvider.deleteUser()` を追加
- `suspendCustomer` — `authProvider.banUser()` を追加
- `reactivateCustomer` — `authProvider.unbanUser()` を追加
- `deleteMemberAccount` — `authProvider.deleteUser()` を追加
