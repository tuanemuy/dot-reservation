# Customer ドメイン

## 概要

Customerドメインは、顧客情報の管理を担当します。会員登録時の基本情報、初回来院時に入力する追加個人情報、問診情報を管理し、顧客の検索や情報変更履歴を記録します。

## エンティティ

### Customer

顧客を表すエンティティ。会員登録時の基本情報を保持します。

```typescript
export type Customer = Readonly<{
  id: CustomerId;
  userId: UserId;

  // 基本情報（会員登録時に必須）
  firstName: PersonName;
  lastName: PersonName;
  firstNameKana: PersonNameKana;
  lastNameKana: PersonNameKana;
  email: Email;
  phoneNumber: PhoneNumber;

  // スポーツ情報（任意）
  isSportsActive: boolean;
  sportsName: string | null;
  sportsAffiliation: string | null;

  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- UserIdと1対1の関係
- 基本情報（名前、カナ、Email、電話番号）は必須
- スポーツをしている場合、競技名と所属は任意
- Emailは変更できない（Authenticationドメインで管理）

### PersonalInfo

追加個人情報を表すエンティティ。初回来院時にタブレットで入力されます。

```typescript
export type PersonalInfo = Readonly<{
  customerId: CustomerId;

  // 住所情報（任意）
  postalCode: PostalCode | null;
  prefecture: Prefecture | null;
  city: string | null;
  streetAddress: string | null;
  building: string | null;

  // その他の個人情報（任意）
  dateOfBirth: Date | null;
  gender: Gender | null;
  occupation: string | null;

  // 緊急連絡先（任意）
  emergencyContactName: PersonName | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: PhoneNumber | null;

  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- CustomerIdと1対1の関係
- すべての項目が任意
- 緊急連絡先を設定する場合、名前・続柄・電話番号はセット

### Interview

問診情報を表すエンティティ。初回来院時に記録されます。

```typescript
export type Interview = Readonly<{
  id: InterviewId;
  customerId: CustomerId;

  // 必須項目
  visitPurpose: string;
  mainSymptoms: string;

  // 任意項目
  symptomOnsetDate: Date | null;
  symptomCause: string | null;
  painLevel: PainLevel | null;
  medicalHistory: string | null;
  currentTreatments: string | null;
  medications: string | null;
  allergies: string | null;
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;
}>;
```

**ビジネスルール**:
- 来院目的と主な症状は必須
- その他の項目は任意
- 痛みの程度は0-10の範囲

### ChangeHistory

顧客情報の変更履歴を表すエンティティ。

```typescript
export type ChangeHistory = Readonly<{
  id: ChangeHistoryId;
  customerId: CustomerId;
  changedBy: UserId;
  changedFields: ChangedField[];
  changedAt: Date;
}>;

export type ChangedField = {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
};
```

**ビジネスルール**:
- 顧客情報の変更時に自動的に記録
- 誰が、いつ、何を変更したかを記録

## 値オブジェクト

### CustomerId

```typescript
export type CustomerId = string & { readonly brand: "CustomerId" };

export function createCustomerId(id: string): CustomerId;
export function generateCustomerId(): CustomerId;
```

### PersonName

```typescript
export type PersonName = string & { readonly brand: "PersonName" };

export function createPersonName(name: string): PersonName;
```

**バリデーション**:
- 1文字以上、50文字以内
- 空白のみは不可

### PersonNameKana

```typescript
export type PersonNameKana = string & { readonly brand: "PersonNameKana" };

export function createPersonNameKana(kana: string): PersonNameKana;
```

**バリデーション**:
- 1文字以上、50文字以内
- カタカナのみ（全角カタカナ）

### PhoneNumber

```typescript
export type PhoneNumber = string & { readonly brand: "PhoneNumber" };

export function createPhoneNumber(phone: string): PhoneNumber;
```

**バリデーション**:
- 10桁または11桁の数字
- ハイフンなし

### PostalCode

```typescript
export type PostalCode = string & { readonly brand: "PostalCode" };

export function createPostalCode(code: string): PostalCode;
```

**バリデーション**:
- 7桁の数字（ハイフンなし）

### Prefecture

```typescript
export type Prefecture = string & { readonly brand: "Prefecture" };

export function createPrefecture(prefecture: string): Prefecture;
```

**バリデーション**:
- 日本の都道府県名リストに含まれること

### Gender

```typescript
export type Gender = "male" | "female" | "other";

export function createGender(gender: string): Gender;
```

### PainLevel

```typescript
export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function createPainLevel(level: number): PainLevel;
```

**バリデーション**:
- 0から10の整数

### InterviewId / ChangeHistoryId

```typescript
export type InterviewId = string & { readonly brand: "InterviewId" };
export type ChangeHistoryId = string & { readonly brand: "ChangeHistoryId" };

export function generateInterviewId(): InterviewId;
export function generateChangeHistoryId(): ChangeHistoryId;
```

## エラーコード

```typescript
export enum CustomerErrorCode {
  // 基本情報
  InvalidPersonName = "INVALID_PERSON_NAME",
  InvalidPersonNameKana = "INVALID_PERSON_NAME_KANA",
  InvalidPhoneNumber = "INVALID_PHONE_NUMBER",

  // 住所情報
  InvalidPostalCode = "INVALID_POSTAL_CODE",
  InvalidPrefecture = "INVALID_PREFECTURE",

  // 緊急連絡先
  IncompleteEmergencyContact = "INCOMPLETE_EMERGENCY_CONTACT",

  // 問診
  EmptyVisitPurpose = "EMPTY_VISIT_PURPOSE",
  EmptyMainSymptoms = "EMPTY_MAIN_SYMPTOMS",
  InvalidPainLevel = "INVALID_PAIN_LEVEL",

  // その他
  CustomerNotFound = "CUSTOMER_NOT_FOUND",
  InterviewNotFound = "INTERVIEW_NOT_FOUND",
}
```

## ポート

### CustomerRepository

```typescript
export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(id: CustomerId): Promise<Customer | null>;
  findByUserId(userId: UserId): Promise<Customer | null>;
  findByEmail(email: Email): Promise<Customer | null>;
  findByPhoneNumber(phone: PhoneNumber): Promise<Customer | null>;
  search(query: CustomerSearchQuery): Promise<Customer[]>;
}

export type CustomerSearchQuery = {
  name?: string;
  email?: string;
  phone?: string;
  limit?: number;
  offset?: number;
};
```

### PersonalInfoRepository

```typescript
export interface PersonalInfoRepository {
  save(info: PersonalInfo): Promise<void>;
  findByCustomerId(customerId: CustomerId): Promise<PersonalInfo | null>;
  delete(customerId: CustomerId): Promise<void>;
}
```

### InterviewRepository

```typescript
export interface InterviewRepository {
  save(interview: Interview): Promise<void>;
  findById(id: InterviewId): Promise<Interview | null>;
  findByCustomerId(customerId: CustomerId): Promise<Interview | null>;
  update(interview: Interview): Promise<void>;
}
```

### ChangeHistoryRepository

```typescript
export interface ChangeHistoryRepository {
  save(history: ChangeHistory): Promise<void>;
  findByCustomerId(customerId: CustomerId): Promise<ChangeHistory[]>;
}
```

## ユースケース

### 1. createCustomer

顧客を作成する（会員登録時）。

```typescript
export type CreateCustomerInput = {
  userId: string;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  email: string;
  phoneNumber: string;
  isSportsActive: boolean;
  sportsName?: string;
  sportsAffiliation?: string;
};

export async function createCustomer(
  context: Context,
  input: CreateCustomerInput
): Promise<Customer>;
```

**処理フロー**:
1. 現在のユーザーIDがinput.userIdと一致するかチェック
2. 電話番号の重複チェック
3. 値オブジェクトの作成（バリデーション）
4. Customerエンティティの作成
5. データベースに保存

**エラー**:
- `BusinessRuleError`: バリデーションエラー
- `ConflictError`: 電話番号重複
- `ForbiddenError`: ユーザーID不一致

### 2. updateCustomer

顧客情報を更新する。

```typescript
export type UpdateCustomerInput = {
  customerId: string;
  firstName?: string;
  lastName?: string;
  firstNameKana?: string;
  lastNameKana?: string;
  phoneNumber?: string;
  isSportsActive?: boolean;
  sportsName?: string;
  sportsAffiliation?: string;
};

export async function updateCustomer(
  context: Context,
  input: UpdateCustomerInput
): Promise<Customer>;
```

**処理フロー**:
1. 顧客を検索
2. 権限チェック（自分の情報またはスタッフ）
3. 電話番号が変更される場合、重複チェック
4. 値オブジェクトの作成（バリデーション）
5. 変更前後の差分を計算
6. Customerエンティティの更新
7. データベースに保存
8. 変更履歴を記録

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `BusinessRuleError`: バリデーションエラー
- `ConflictError`: 電話番号重複
- `ForbiddenError`: 権限なし

### 3. getCustomer

顧客情報を取得する。

```typescript
export type GetCustomerInput = {
  customerId: string;
};

export async function getCustomer(
  context: Context,
  input: GetCustomerInput
): Promise<Customer>;
```

**処理フロー**:
1. 顧客を検索
2. 権限チェック（自分の情報またはスタッフ）
3. 顧客情報を返却

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `ForbiddenError`: 権限なし

### 4. searchCustomers

顧客を検索する（スタッフのみ）。

```typescript
export type SearchCustomersInput = {
  name?: string;
  email?: string;
  phone?: string;
  limit?: number;
  offset?: number;
};

export async function searchCustomers(
  context: Context,
  input: SearchCustomersInput
): Promise<Customer[]>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 検索クエリの構築
3. データベース検索
4. 結果を返却

**エラー**:
- `ForbiddenError`: スタッフ権限なし

### 5. createOrUpdatePersonalInfo

追加個人情報を作成または更新する。

```typescript
export type CreateOrUpdatePersonalInfoInput = {
  customerId: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  streetAddress?: string;
  building?: string;
  dateOfBirth?: Date;
  gender?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
};

export async function createOrUpdatePersonalInfo(
  context: Context,
  input: CreateOrUpdatePersonalInfoInput
): Promise<PersonalInfo>;
```

**処理フロー**:
1. 顧客を検索
2. 権限チェック（自分の情報またはスタッフ）
3. 緊急連絡先の整合性チェック
4. 値オブジェクトの作成（バリデーション）
5. PersonalInfoエンティティの作成または更新
6. データベースに保存
7. 変更履歴を記録（更新の場合）

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `BusinessRuleError`: バリデーションエラー、緊急連絡先不完全
- `ForbiddenError`: 権限なし

### 6. getPersonalInfo

追加個人情報を取得する。

```typescript
export type GetPersonalInfoInput = {
  customerId: string;
};

export async function getPersonalInfo(
  context: Context,
  input: GetPersonalInfoInput
): Promise<PersonalInfo | null>;
```

**処理フロー**:
1. 顧客を検索
2. 権限チェック（自分の情報またはスタッフ）
3. PersonalInfoを検索
4. 結果を返却

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `ForbiddenError`: 権限なし

### 7. createOrUpdateInterview

問診情報を作成または更新する（スタッフのみ）。

```typescript
export type CreateOrUpdateInterviewInput = {
  customerId: string;
  visitPurpose: string;
  mainSymptoms: string;
  symptomOnsetDate?: Date;
  symptomCause?: string;
  painLevel?: number;
  medicalHistory?: string;
  currentTreatments?: string;
  medications?: string;
  allergies?: string;
  notes?: string;
};

export async function createOrUpdateInterview(
  context: Context,
  input: CreateOrUpdateInterviewInput
): Promise<Interview>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 顧客を検索
3. 値オブジェクトの作成（バリデーション）
4. 既存の問診を検索
5. Interviewエンティティの作成または更新
6. データベースに保存
7. 変更履歴を記録（更新の場合）

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 顧客が見つからない
- `BusinessRuleError`: バリデーションエラー

### 8. getInterview

問診情報を取得する。

```typescript
export type GetInterviewInput = {
  customerId: string;
};

export async function getInterview(
  context: Context,
  input: GetInterviewInput
): Promise<Interview | null>;
```

**処理フロー**:
1. 権限チェック（自分の情報またはスタッフ）
2. 顧客を検索
3. Interviewを検索
4. 結果を返却

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `ForbiddenError`: 権限なし

### 9. getChangeHistory

顧客情報の変更履歴を取得する（スタッフのみ）。

```typescript
export type GetChangeHistoryInput = {
  customerId: string;
};

export async function getChangeHistory(
  context: Context,
  input: GetChangeHistoryInput
): Promise<ChangeHistory[]>;
```

**処理フロー**:
1. スタッフ権限チェック
2. 顧客を検索
3. 変更履歴を検索
4. 結果を返却

**エラー**:
- `ForbiddenError`: スタッフ権限なし
- `NotFoundError`: 顧客が見つからない

### 10. deleteCustomer

顧客を削除する（管理者のみ、または自分のアカウント削除）。

```typescript
export type DeleteCustomerInput = {
  customerId: string;
};

export async function deleteCustomer(
  context: Context,
  input: DeleteCustomerInput
): Promise<void>;
```

**処理フロー**:
1. 顧客を検索
2. 権限チェック（自分の情報または管理者）
3. 有効な予約があるかチェック
4. PersonalInfo、Interview、ChangeHistoryを削除
5. Customerを削除

**エラー**:
- `NotFoundError`: 顧客が見つからない
- `ForbiddenError`: 権限なし
- `BusinessRuleError`: 有効な予約がある

## 補足

### プライバシーとセキュリティ

1. **個人情報の保護**:
   - 個人情報は暗号化して保存することを推奨
   - アクセス権限を厳格に管理
   - 変更履歴を記録し、監査可能に

2. **データの最小化**:
   - 必要最小限の情報のみ収集
   - 任意項目は顧客が自由に入力/削除可能

3. **GDPR/個人情報保護法対応**:
   - 顧客が自分のデータを確認・修正・削除できる
   - データポータビリティ（将来的にエクスポート機能を追加）

### 拡張性

- 将来的な問診テンプレートのカスタマイズに対応
- 複数の問診記録の保存（来院ごとに記録）
- カルテ機能への拡張
