# Authentication ドメイン

## 概要

Authenticationドメインは、ユーザー認証、セッション管理、アクセス制御を担当します。顧客とスタッフの両方のアカウント管理を行い、Email/パスワード認証とSSO認証をサポートします。

## エンティティ

### User

ユーザーアカウントを表すエンティティ。顧客とスタッフの両方を含みます。

```typescript
export type UserBase = Readonly<{
  id: UserId;
  email: Email;
  emailVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}>;

export type EmailPasswordUser = UserBase & {
  authType: "email";
  passwordHash: PasswordHash;
};

export type SSOUser = UserBase & {
  authType: "sso";
  provider: SSOProvider;
  providerId: string;
};

export type User = EmailPasswordUser | SSOUser;
```

**ビジネスルール**:
- Emailは一意でなければならない
- スタッフユーザーは必ずロールを持つ（Admin, Staff）
- 顧客ユーザーのロールは常にCustomer
- Email未確認のユーザーは一部機能が制限される

**状態遷移**:
- 作成時: `emailVerified = false`
- Email確認後: `emailVerified = true`

### Session

ユーザーのログインセッションを表すエンティティ。

```typescript
export type Session = Readonly<{
  id: SessionId;
  userId: UserId;
  token: SessionToken;
  expiresAt: Date;
  createdAt: Date;
}>;
```

**ビジネスルール**:
- セッションには有効期限がある
- 有効期限を過ぎたセッションは無効
- ユーザーは同時に複数のセッションを持てる（異なるデバイス）

### PasswordResetToken

パスワードリセット用のトークンを表すエンティティ。

```typescript
export type PasswordResetToken = Readonly<{
  id: TokenId;
  userId: UserId;
  token: Token;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}>;
```

**ビジネスルール**:
- トークンには有効期限がある（例: 1時間）
- 使用済みトークンは再利用できない
- 有効期限切れトークンは使用できない

### EmailVerificationToken

メールアドレス確認用のトークンを表すエンティティ。

```typescript
export type EmailVerificationToken = Readonly<{
  id: TokenId;
  userId: UserId;
  email: Email;
  token: Token;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}>;
```

**ビジネスルール**:
- トークンには有効期限がある（例: 24時間）
- 確認済みトークンは再利用できない
- 有効期限切れトークンは使用できない

### StaffAccount

スタッフアカウント招待を表すエンティティ。

```typescript
export type StaffAccount = Readonly<{
  id: StaffAccountId;
  email: Email;
  role: StaffRole;
  invitationToken: Token;
  invitationSentAt: Date;
  invitationExpiresAt: Date;
  userId: UserId | null;
  activatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- 招待トークンには有効期限がある（例: 7日間）
- アクティベート後は招待トークンは無効
- ロールは Admin または Staff のみ

## 値オブジェクト

### UserId

```typescript
export type UserId = string & { readonly brand: "UserId" };

export function createUserId(id: string): UserId;
export function generateUserId(): UserId;
```

### Email

```typescript
export type Email = string & { readonly brand: "Email" };

export function createEmail(email: string): Email;
```

**バリデーション**:
- Email形式であること
- 最大長: 255文字

### PasswordHash

```typescript
export type PasswordHash = string & { readonly brand: "PasswordHash" };

export function createPasswordHash(hash: string): PasswordHash;
```

### Password

```typescript
export type Password = string & { readonly brand: "Password" };

export function createPassword(password: string): Password;
```

**バリデーション**:
- 最小長: 8文字
- 最大長: 128文字
- 少なくとも1つの英字と1つの数字を含む

### SessionToken / Token

```typescript
export type SessionToken = string & { readonly brand: "SessionToken" };
export type Token = string & { readonly brand: "Token" };

export function generateSessionToken(): SessionToken;
export function generateToken(): Token;
```

### UserRole

```typescript
export type UserRole = "customer" | "staff" | "admin";

export function createUserRole(role: string): UserRole;
```

### StaffRole

```typescript
export type StaffRole = "staff" | "admin";

export function createStaffRole(role: string): StaffRole;
```

### SSOProvider

```typescript
export type SSOProvider = "google" | "facebook" | "line";

export function createSSOProvider(provider: string): SSOProvider;
```

## エラーコード

```typescript
export enum AuthenticationErrorCode {
  // Email/Password
  InvalidEmailFormat = "INVALID_EMAIL_FORMAT",
  WeakPassword = "WEAK_PASSWORD",
  EmailAlreadyExists = "EMAIL_ALREADY_EXISTS",
  InvalidCredentials = "INVALID_CREDENTIALS",

  // Email Verification
  EmailNotVerified = "EMAIL_NOT_VERIFIED",
  InvalidVerificationToken = "INVALID_VERIFICATION_TOKEN",
  VerificationTokenExpired = "VERIFICATION_TOKEN_EXPIRED",

  // Password Reset
  InvalidResetToken = "INVALID_RESET_TOKEN",
  ResetTokenExpired = "RESET_TOKEN_EXPIRED",
  ResetTokenAlreadyUsed = "RESET_TOKEN_ALREADY_USED",

  // Session
  InvalidSession = "INVALID_SESSION",
  SessionExpired = "SESSION_EXPIRED",

  // Staff Account
  InvalidInvitationToken = "INVALID_INVITATION_TOKEN",
  InvitationExpired = "INVITATION_EXPIRED",
  InvitationAlreadyUsed = "INVITATION_ALREADY_USED",
  InvalidStaffRole = "INVALID_STAFF_ROLE",
}
```

## ポート

### UserRepository

```typescript
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  delete(id: UserId): Promise<void>;
}
```

### SessionRepository

```typescript
export interface SessionRepository {
  save(session: Session): Promise<void>;
  findById(id: SessionId): Promise<Session | null>;
  findByToken(token: SessionToken): Promise<Session | null>;
  findByUserId(userId: UserId): Promise<Session[]>;
  delete(id: SessionId): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
  deleteExpired(): Promise<void>;
}
```

### PasswordResetTokenRepository

```typescript
export interface PasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<void>;
  findByToken(token: Token): Promise<PasswordResetToken | null>;
  delete(id: TokenId): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
}
```

### EmailVerificationTokenRepository

```typescript
export interface EmailVerificationTokenRepository {
  save(token: EmailVerificationToken): Promise<void>;
  findByToken(token: Token): Promise<EmailVerificationToken | null>;
  delete(id: TokenId): Promise<void>;
  deleteByUserId(userId: UserId): Promise<void>;
}
```

### StaffAccountRepository

```typescript
export interface StaffAccountRepository {
  save(account: StaffAccount): Promise<void>;
  findById(id: StaffAccountId): Promise<StaffAccount | null>;
  findByEmail(email: Email): Promise<StaffAccount | null>;
  findByInvitationToken(token: Token): Promise<StaffAccount | null>;
  findAll(): Promise<StaffAccount[]>;
  delete(id: StaffAccountId): Promise<void>;
}
```

### PasswordHasher

パスワードのハッシュ化と検証を行うポート。

```typescript
export interface PasswordHasher {
  hash(password: Password): Promise<PasswordHash>;
  verify(password: Password, hash: PasswordHash): Promise<boolean>;
}
```

### SSOProvider (外部認証プロバイダー)

SSO認証を行うポート。

```typescript
export interface SSOAuthProvider {
  authenticate(provider: SSOProvider, code: string): Promise<SSOAuthResult>;
}

export type SSOAuthResult = {
  providerId: string;
  email: Email;
  name: string;
};
```

## ユースケース

### 1. registerWithEmail

Email/パスワードで新規ユーザーを登録する。

```typescript
export type RegisterWithEmailInput = {
  email: string;
  password: string;
  role: UserRole;
};

export async function registerWithEmail(
  context: Context,
  input: RegisterWithEmailInput
): Promise<User>;
```

**処理フロー**:
1. Emailの重複チェック
2. パスワードのバリデーション
3. パスワードのハッシュ化
4. ユーザーエンティティの作成
5. データベースに保存
6. Email確認トークンの生成と保存
7. 確認メールの送信

**エラー**:
- `BusinessRuleError`: Email形式不正、パスワード強度不足
- `ConflictError`: Email重複

### 2. registerWithSSO

SSO認証で新規ユーザーを登録する。

```typescript
export type RegisterWithSSOInput = {
  provider: SSOProvider;
  code: string;
  role: UserRole;
};

export async function registerWithSSO(
  context: Context,
  input: RegisterWithSSOInput
): Promise<User>;
```

**処理フロー**:
1. SSOプロバイダーで認証
2. プロバイダーIDの重複チェック
3. ユーザーエンティティの作成（emailVerified = true）
4. データベースに保存

**エラー**:
- `SystemError`: SSO認証失敗
- `ConflictError`: 既存ユーザーが存在

### 3. loginWithEmail

Email/パスワードでログインする。

```typescript
export type LoginWithEmailInput = {
  email: string;
  password: string;
};

export async function loginWithEmail(
  context: Context,
  input: LoginWithEmailInput
): Promise<{ user: User; session: Session }>;
```

**処理フロー**:
1. Emailでユーザーを検索
2. パスワードの検証
3. セッションの作成
4. データベースに保存

**エラー**:
- `UnauthorizedError`: 認証情報不正

### 4. loginWithSSO

SSO認証でログインする。

```typescript
export type LoginWithSSOInput = {
  provider: SSOProvider;
  code: string;
};

export async function loginWithSSO(
  context: Context,
  input: LoginWithSSOInput
): Promise<{ user: User; session: Session }>;
```

**処理フロー**:
1. SSOプロバイダーで認証
2. プロバイダーIDでユーザーを検索
3. セッションの作成
4. データベースに保存

**エラー**:
- `SystemError`: SSO認証失敗
- `UnauthorizedError`: ユーザーが見つからない

### 5. logout

ログアウトする。

```typescript
export async function logout(context: Context): Promise<void>;
```

**処理フロー**:
1. 現在のセッションを取得
2. セッションを削除

### 6. verifyEmail

メールアドレスを確認する。

```typescript
export type VerifyEmailInput = {
  token: string;
};

export async function verifyEmail(
  context: Context,
  input: VerifyEmailInput
): Promise<void>;
```

**処理フロー**:
1. トークンで検証トークンを検索
2. 有効期限チェック
3. ユーザーのemailVerifiedをtrueに更新
4. トークンを使用済みにマーク

**エラー**:
- `NotFoundError`: トークンが見つからない
- `BusinessRuleError`: トークン期限切れ

### 7. requestPasswordReset

パスワードリセットをリクエストする。

```typescript
export type RequestPasswordResetInput = {
  email: string;
};

export async function requestPasswordReset(
  context: Context,
  input: RequestPasswordResetInput
): Promise<void>;
```

**処理フロー**:
1. Emailでユーザーを検索
2. パスワードリセットトークンの生成
3. データベースに保存
4. リセットメールの送信

**エラー**:
- セキュリティのため、Emailが見つからない場合もエラーを返さない

### 8. resetPassword

パスワードをリセットする。

```typescript
export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

export async function resetPassword(
  context: Context,
  input: ResetPasswordInput
): Promise<void>;
```

**処理フロー**:
1. トークンでリセットトークンを検索
2. 有効期限チェック
3. 使用済みチェック
4. 新しいパスワードのバリデーション
5. パスワードのハッシュ化
6. ユーザーのパスワードを更新
7. トークンを使用済みにマーク
8. すべてのセッションを無効化

**エラー**:
- `NotFoundError`: トークンが見つからない
- `BusinessRuleError`: トークン期限切れ、使用済み、パスワード強度不足

### 9. createStaffAccount

スタッフアカウントを作成し、招待メールを送信する（管理者のみ）。

```typescript
export type CreateStaffAccountInput = {
  email: string;
  role: StaffRole;
};

export async function createStaffAccount(
  context: Context,
  input: CreateStaffAccountInput
): Promise<StaffAccount>;
```

**処理フロー**:
1. 現在のユーザーが管理者かチェック
2. Emailの重複チェック
3. 招待トークンの生成
4. スタッフアカウントエンティティの作成
5. データベースに保存
6. 招待メールの送信

**エラー**:
- `ForbiddenError`: 管理者権限がない
- `ConflictError`: Email重複

### 10. activateStaffAccount

招待トークンを使ってスタッフアカウントをアクティベートする。

```typescript
export type ActivateStaffAccountInput = {
  token: string;
  password: string;
};

export async function activateStaffAccount(
  context: Context,
  input: ActivateStaffAccountInput
): Promise<User>;
```

**処理フロー**:
1. トークンでスタッフアカウントを検索
2. 有効期限チェック
3. アクティベート済みチェック
4. パスワードのバリデーション
5. パスワードのハッシュ化
6. ユーザーエンティティの作成（emailVerified = true）
7. スタッフアカウントの更新（userId設定、activatedAt設定）
8. データベースに保存

**エラー**:
- `NotFoundError`: トークンが見つからない
- `BusinessRuleError`: トークン期限切れ、アクティベート済み、パスワード強度不足

### 11. resendInvitation

招待メールを再送信する（管理者のみ）。

```typescript
export type ResendInvitationInput = {
  staffAccountId: string;
};

export async function resendInvitation(
  context: Context,
  input: ResendInvitationInput
): Promise<void>;
```

**処理フロー**:
1. 現在のユーザーが管理者かチェック
2. スタッフアカウントを検索
3. アクティベート済みチェック
4. 新しい招待トークンの生成
5. スタッフアカウントの更新
6. 招待メールの送信

**エラー**:
- `ForbiddenError`: 管理者権限がない
- `NotFoundError`: スタッフアカウントが見つからない
- `BusinessRuleError`: 既にアクティベート済み

### 12. deleteAccount

アカウントを削除する。

```typescript
export async function deleteAccount(context: Context): Promise<void>;
```

**処理フロー**:
1. 現在のユーザーを取得
2. 有効な予約があるかチェック（顧客の場合）
3. ユーザーを削除
4. すべてのセッションを削除
5. 削除完了メールの送信

**エラー**:
- `BusinessRuleError`: 有効な予約がある

## 補足

### セキュリティ考慮事項

1. **パスワード保護**:
   - パスワードは必ずハッシュ化して保存
   - bcryptなどの適切なハッシュアルゴリズムを使用

2. **トークン管理**:
   - トークンは暗号学的に安全な乱数を使用
   - 有効期限を適切に設定
   - 使用後は必ず無効化

3. **セッション管理**:
   - セッションタイムアウトを設定
   - 重要な操作の前にセッションの有効性を確認

4. **レート制限**:
   - ログイン試行回数の制限
   - パスワードリセット要求の制限

### 拡張性

- 将来的な多要素認証（MFA）の追加を考慮
- SSOプロバイダーの追加が容易な設計
- ロールベースアクセス制御（RBAC）の拡張が可能
