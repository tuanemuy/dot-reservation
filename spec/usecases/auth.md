# Auth ユースケース統合

## 概要

Auth 固有の独立したユースケースは定義しない。認証操作（サインアップ、サインイン、サインアウト、パスワードリセット等）は better-auth が直接ハンドリングする。

本ドキュメントでは、既存ユースケースに対する AuthProvider ポート呼び出しの変更、`cleanupAuthUserIfOrphaned` ユーティリティユースケースの定義、および Container 型への AuthProvider 追加を定義する。

---

## Container 型への AuthProvider 追加

`Container` 型に `authProvider: AuthProvider` を追加する。

```typescript
type Container = {
  config: AppConfig;
  unitOfWorkProvider: UnitOfWorkProvider;
  authProvider: AuthProvider;  // 追加
  // ... existing repositories and services
};
```

---

## cleanupAuthUserIfOrphaned — auth ユーザーの条件付き削除

### 概要

Customer または Member のアカウント削除後に呼び出す。auth ユーザーに紐づくドメインエンティティが一つも存在しない場合にのみ、auth ユーザーを削除する。

### 入力DTO

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| authUserId | string | ✓ | 認証ユーザーID |

### 出力DTO

なし

### 処理フロー

1. `customerRepository.findByAuthUserId(authUserId)` で Customer の存在を確認する
2. `memberRepository.findByAuthUserId(authUserId)` で Member の存在を確認する
3. 両方とも存在しない → `authProvider.deleteUser(authUserId)` で auth ユーザーを削除する
4. いずれかが存在する → 何もしない（auth ユーザーを維持する）

### エラーケース

- auth ユーザーの削除に失敗した場合: orphaned な auth ユーザーが残る可能性がある。ログを記録して後続のバッチ処理で対応する

### テストケース

- Customer も Member も存在しない → auth ユーザーが削除される
- Customer のみ存在する → auth ユーザーは維持される
- Member のみ存在する → auth ユーザーは維持される
- Customer と Member の両方が存在する → auth ユーザーは維持される

---

## 既存ユースケースの変更

### deleteCustomer — auth 統合

#### 変更内容

処理フローの最後に `cleanupAuthUserIfOrphaned(customer.authUserId)` を追加する。

#### 変更後の処理フロー

1. 顧客を取得する
2. 未来の確定予約がないことを確認する
3. 顧客エンティティを削除する
4. **`cleanupAuthUserIfOrphaned(customer.authUserId)` で auth ユーザーを条件付き削除する**
5. `customer.deleted` イベントを発行する

#### 補足

- 同一 authUserId で Member エンティティが存在する場合、auth ユーザーは削除されない（メンバーとしての利用を継続できる）

---

### suspendCustomer — auth 統合

#### 変更内容

Customer.status を "suspended" に変更するのみ。**better-auth の BAN は使用しない**。

#### 変更後の処理フロー

1. 顧客を取得する
2. `Customer.suspend(customer)` で顧客エンティティを停止する
3. 顧客エンティティを保存する
4. `customer.suspended` イベントを発行する

#### 補足

- `authProvider.banUser()` は呼び出さない
- 顧客ページの loader で Customer.status === "suspended" をチェックし、停止中ならエラーページを表示する
- メンバーとしてのアクセスは影響を受けない（auth ユーザーは BAN されない）

---

### reactivateCustomer — auth 統合

#### 変更内容

Customer.status を "active" に変更するのみ。**better-auth の unban は使用しない**。

#### 変更後の処理フロー

1. 顧客を取得する
2. `Customer.reactivate(customer)` で顧客エンティティを再開する
3. 顧客エンティティを保存する
4. `customer.reactivated` イベントを発行する

#### 補足

- `authProvider.unbanUser()` は呼び出さない

---

### deleteMemberAccount — auth 統合

#### 変更内容

処理フローの最後に `cleanupAuthUserIfOrphaned(authUserId)` を追加する。

#### 変更後の処理フロー

1. メンバーの authUserId から所属する全テナントのメンバーシップを取得する
2. `MemberPolicyService.canDeleteAccount()` でアカウント削除可能か検証する
3. 全テナントから脱退する（Member エンティティを削除）
4. 担当予約を「担当者未定」にする
5. **`cleanupAuthUserIfOrphaned(authUserId)` で auth ユーザーを条件付き削除する**

#### 補足

- 同一 authUserId で Customer エンティティが存在する場合、auth ユーザーは削除されない（顧客としての利用を継続できる）

---

## ルートローダーでのセッション検証パターン

各ルートのローダーで以下のパターンを使用してセッション検証を行う。これはユースケースではなく、プレゼンテーション層のパターンである。

### 顧客ページ

```
1. container.authProvider.getSession(request.headers) でセッションを取得
2. セッションがない → /customer/login にリダイレクト
3. container.customerRepository.findByAuthUserId(session.user.id) で顧客を取得
4. 顧客が見つからない → /customer/setup にリダイレクト（auth ユーザーはあるが Customer 未作成）
5. 顧客が停止中（status === "suspended"） → アカウント停止エラーページ表示
6. 顧客情報をローダーデータとして返す
```

### 管理画面

```
1. container.authProvider.getSession(request.headers) でセッションを取得
2. セッションがない → /admin/login にリダイレクト
3. container.memberRepository.findByAuthUserId(session.user.id) でメンバー一覧を取得
4. メンバーが見つからない → /admin/setup にリダイレクト（auth ユーザーはあるが Member 未作成）
5. テナント選択 or ダッシュボードにルーティング
```

### プラットフォーム管理画面

```
1. container.authProvider.getSession(request.headers) でセッションを取得
2. セッションがない → /platform/login にリダイレクト
3. session.user.role !== "admin" → /platform/login にリダイレクト（管理者権限なし）
4. 管理ダッシュボードを表示
```

---

## フロントエンド認証操作

フロントエンドでは better-auth クライアント SDK を使用して以下の操作を行う。これらはユースケースではなく、クライアントサイドの操作である。

### authClient の初期化

```
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

### 操作一覧

| 操作 | メソッド | 備考 |
|---|---|---|
| ユーザー登録 | `authClient.signUp.email({ name, email, password })` | 成功後にドメインエンティティ作成。「メール登録済み」エラー時はログインを促す |
| ログイン | `authClient.signIn.email({ email, password })` | |
| ログアウト | `authClient.signOut()` | |
| パスワードリセット依頼 | `authClient.forgetPassword({ email, redirectTo })` | |
| パスワード再設定 | `authClient.resetPassword({ newPassword, token })` | token は URL パラメータから取得 |
| パスワード変更 | `authClient.changePassword({ currentPassword, newPassword })` | ログイン中に使用 |
| メールアドレス変更 | `authClient.changeEmail({ newEmail })` | 確認メールが送信される |
| セッション取得 | `authClient.useSession()` | React Hook |
