import { verifyPassword as verifyPasswordHash } from "better-auth/crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/core/adapters/drizzleSqlite/client";
import { accounts, sessions } from "@/core/adapters/drizzleSqlite/schema";
import type { AuthProvider } from "@/core/domain/auth/ports/authProvider";
import type { AuthSession, AuthUser } from "@/core/domain/auth/types";
import type { BetterAuth } from "./server";

export class BetterAuthProvider implements AuthProvider {
  constructor(
    private readonly auth: BetterAuth,
    private readonly db: Database,
  ) {}

  async getSession(
    headers: Headers,
  ): Promise<{ user: AuthUser; session: AuthSession } | null> {
    const result = await this.auth.api.getSession({ headers });
    if (!result) {
      return null;
    }

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: result.user.emailVerified,
        role: result.user.role ?? "user",
        banned: result.user.banned ?? false,
        banReason: result.user.banReason ?? null,
        banExpires: result.user.banExpires
          ? new Date(result.user.banExpires)
          : null,
        createdAt: new Date(result.user.createdAt),
        updatedAt: new Date(result.user.updatedAt),
      },
      session: {
        id: result.session.id,
        userId: result.session.userId,
        token: result.session.token,
        expiresAt: new Date(result.session.expiresAt),
        ipAddress: result.session.ipAddress ?? null,
        userAgent: result.session.userAgent ?? null,
        createdAt: new Date(result.session.createdAt),
        updatedAt: new Date(result.session.updatedAt),
      },
    };
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.auth.api.removeUser({
        body: { userId },
      });
    } catch (_error: unknown) {
      // Ignore errors when user already does not exist (idempotent)
    }
  }

  async banUser(userId: string, reason?: string): Promise<void> {
    await this.auth.api.banUser({
      body: { userId, banReason: reason },
    });
  }

  async unbanUser(userId: string): Promise<void> {
    await this.auth.api.unbanUser({
      body: { userId },
    });
  }

  async getLastLoginAt(userId: string): Promise<Date | null> {
    const rows = await this.db
      .select({ createdAt: sessions.createdAt })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return rows[0].createdAt;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const rows = await this.db
      .select({ password: accounts.password })
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
      )
      .limit(1);

    if (rows.length === 0 || rows[0].password === null) {
      return false;
    }

    return verifyPasswordHash({ hash: rows[0].password, password });
  }
}
