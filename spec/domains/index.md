# ドメイン設計

## 概要

このドキュメントでは、接骨院・整骨院向けWeb予約システムのドメイン区分と、各ドメインの責務を定義します。

DDDにおけるヘキサゴナルアーキテクチャを採用し、ビジネスロジックをドメイン層に集約し、外部システムとの依存をポート・アダプターパターンで分離します。

## ドメイン一覧

### 1. Authentication（認証）

**責務**: ユーザー認証、セッション管理、アクセス制御

- Email/パスワード認証
- SSO認証
- パスワードリセット
- メールアドレス確認
- セッション管理
- スタッフアカウント管理（ロール、権限）

**主要エンティティ**: User, Session, PasswordResetToken, EmailVerificationToken

**詳細**: [authentication.md](./authentication.md)

### 2. Customer（顧客）

**責務**: 顧客情報の管理、問診情報の保存

- 顧客基本情報管理（名前、連絡先、スポーツ情報など）
- 追加個人情報管理（住所、生年月日、緊急連絡先など）
- 問診情報管理（来院目的、症状、既往歴など）
- 顧客検索
- 情報変更履歴

**主要エンティティ**: Customer, Interview, PersonalInfo, ChangeHistory

**詳細**: [customer.md](./customer.md)

### 3. Reservation（予約）

**責務**: 予約のライフサイクル管理、予約可能枠の管理

- 予約作成（顧客側・管理者側）
- 予約変更
- 予約キャンセル
- 来院確認
- No-show処理
- 予約枠の空き状況管理
- 重複予約の防止
- 予約期限チェック（受付期限、変更期限、キャンセル期限）

**主要エンティティ**: Reservation, TimeSlot, ReservationStatus

**詳細**: [reservation.md](./reservation.md)

### 4. Menu（メニュー）

**責務**: 施術メニューの管理

- メニュー情報管理（名前、概要、料金、自費/保険区分）
- メニュー画像管理
- メニューの有効/無効管理
- メニュー削除時の既存予約チェック

**主要エンティティ**: Menu

**詳細**: [menu.md](./menu.md)

### 5. Staff（スタッフ）

**責務**: スタッフ情報とシフト管理

- スタッフ情報管理（名前、画像、担当メニュー、スタッフタイプ）
- スタッフタイプ管理（常勤・非常勤）
- シフト管理（出勤時間、休み時間）
- 勤務可能時間の計算
- スタッフ削除時の既存予約チェック

**主要エンティティ**: Staff, Shift, WorkingHours

**詳細**: [staff.md](./staff.md)

### 6. Clinic（クリニック）

**責務**: 店舗情報と運営設定の管理

- 店舗情報管理（名前、住所、電話番号）
- 営業時間管理（曜日ごとの営業時間、定休日）
- 臨時休業管理
- 予約設定管理（予約枠間隔、最大予約数、各種期限、リマインド設定）

**主要エンティティ**: Clinic, BusinessHours, TemporaryClosure, BookingSettings

**詳細**: [clinic.md](./clinic.md)

### 7. Notification（通知）

**責務**: メール通知の管理と送信

- 予約確認メール
- メールアドレス確認メール
- 予約変更通知メール
- 予約キャンセル通知メール
- リマインドメール
- パスワードリセットメール
- スタッフアカウント招待メール
- メール再送信機能

**主要エンティティ**: EmailNotification, NotificationTemplate

**詳細**: [notification.md](./notification.md)

## ドメイン間の関係

```
┌─────────────────┐
│ Authentication  │
│                 │
│  - User         │
│  - Session      │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         v                  v                  v                  v
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Customer     │ │      Staff      │ │     Clinic      │ │  Notification   │
│                 │ │                 │ │                 │ │                 │
│  - Customer     │ │  - Staff        │ │  - Clinic       │ │  - Email        │
│  - Interview    │ │  - Shift        │ │  - Settings     │ │  - Template     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │                   │
         │                   │                   │
         └───────────┬───────┴───────────────────┘
                     │
                     v
            ┌─────────────────┐
            │   Reservation   │
            │                 │
            │  - Reservation  │
            │  - TimeSlot     │
            └────────┬────────┘
                     │
                     v
            ┌─────────────────┐
            │      Menu       │
            │                 │
            │  - Menu         │
            └─────────────────┘
```

### 依存関係の説明

- **Authentication**: 他のドメインに依存せず、User情報を提供
- **Customer**: Authenticationに依存（UserId参照）
- **Staff**: Authenticationに依存（UserId参照）
- **Menu**: 独立したドメイン
- **Clinic**: 独立したドメイン（システム全体で1つ）
- **Reservation**: Customer、Staff、Menu、Clinicに依存
- **Notification**: 各ドメインのイベントを受けて通知を送信（すべてのドメインから呼ばれる可能性）

## アーキテクチャパターン

各ドメインは以下の構造に従います:

```
app/core/
├── domain/
│   └── ${domain}/
│       ├── entity.ts           # エンティティ定義
│       ├── valueObject.ts      # 値オブジェクト
│       ├── errorCode.ts        # ドメイン固有のエラーコード
│       └── ports/
│           ├── ${domain}Repository.ts  # リポジトリインターフェース
│           └── ...                      # その他のポート
├── adapters/
│   └── ${adapterName}/
│       ├── ${domain}Repository.ts  # リポジトリ実装
│       └── ...                      # その他のアダプター
└── application/
    ├── ${domain}/
    │   ├── ${usecase}.ts       # ユースケース実装
    │   └── ...
    ├── context.ts              # DIコンテキスト
    └── error.ts                # アプリケーション層エラー
```

## 共通パターン

### エンティティ

- 不変性を重視（Readonlyを使用）
- ビジネスルールをエンティティ内に実装
- ファクトリ関数でエンティティを生成
- 状態遷移はメソッドで表現

### 値オブジェクト

- Branded Typeを使用して型安全性を確保
- バリデーションロジックを値オブジェクト生成時に実行
- 不正な値の場合は`BusinessRuleError`をスロー

### エラーハンドリング

- **ドメイン層**: `BusinessRuleError`をスロー（ビジネスルール違反）
- **アプリケーション層**: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `SystemError`をスロー
- **インフラ層**: 外部システムのエラーをキャッチし、アプリケーション層のエラーに変換

### ポート・アダプター

- **ポート**: インターフェースとして定義（domain層）
- **アダプター**: 具体的な実装（adapters層）
- 依存性逆転の原則に従い、ドメイン層が外部に依存しない

## 次のステップ

各ドメインの詳細設計は、個別のドキュメントを参照してください:

1. [authentication.md](./authentication.md) - 認証ドメイン
2. [customer.md](./customer.md) - 顧客ドメイン
3. [reservation.md](./reservation.md) - 予約ドメイン
4. [menu.md](./menu.md) - メニュードメイン
5. [staff.md](./staff.md) - スタッフドメイン
6. [clinic.md](./clinic.md) - クリニックドメイン
7. [notification.md](./notification.md) - 通知ドメイン
