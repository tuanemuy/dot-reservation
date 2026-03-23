import type { AuthSession, AuthUser } from "../types";

export interface AuthProvider {
  getSession(
    headers: Headers,
  ): Promise<{ user: AuthUser; session: AuthSession } | null>;
  deleteUser(userId: string): Promise<void>;
  banUser(userId: string, reason?: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
}
