import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { eq } from "drizzle-orm";
import type { Database } from "@/core/adapters/drizzleSqlite/client";
import { customers, members } from "@/core/adapters/drizzleSqlite/schema";
import type { AuthEmailSender } from "@/core/domain/auth/ports/authEmailSender";

export type BetterAuth = ReturnType<typeof createBetterAuth>;

export function createBetterAuth(params: {
  db: Database;
  baseURL: string;
  secret: string;
  authEmailSender: AuthEmailSender;
}) {
  return betterAuth({
    database: drizzleAdapter(params.db, {
      provider: "sqlite",
      usePlural: true,
    }),
    baseURL: params.baseURL,
    secret: params.secret,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        await params.authEmailSender.sendPasswordResetEmail({
          user: { id: user.id, email: user.email, name: user.name },
          url,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await params.authEmailSender.sendVerificationEmail({
          user: { id: user.id, email: user.email, name: user.name },
          url,
        });
      },
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
    ],
    databaseHooks: {
      user: {
        update: {
          after: async (user) => {
            if (user.email) {
              const now = new Date();
              await params.db
                .update(customers)
                .set({ email: user.email, updatedAt: now })
                .where(eq(customers.authUserId, user.id));
              await params.db
                .update(members)
                .set({ email: user.email, updatedAt: now })
                .where(eq(members.authUserId, user.id));
            }
          },
        },
      },
    },
  });
}
