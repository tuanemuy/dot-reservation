// AuthUser - better-auth が管理するユーザーレコード
type AuthUser = Readonly<{
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: string; // "user" | "admin"
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { AuthUser };

// AuthSession - ログイン中のセッション
type AuthSession = Readonly<{
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { AuthSession };
