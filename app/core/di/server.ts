/**
 * Server-side DI Container
 *
 * This file provides the concrete implementation of the server container
 * with all necessary adapters for server-side operations.
 */

import { BetterAuthProvider } from "@/core/adapters/betterAuth/authProvider";
import { createBetterAuth } from "@/core/adapters/betterAuth/server";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteCustomerRepository } from "@/core/adapters/drizzleSqlite/repositories/customerRepository";
import { DrizzleSqliteInvitationRepository } from "@/core/adapters/drizzleSqlite/repositories/invitationRepository";
import { DrizzleSqliteMemberRepository } from "@/core/adapters/drizzleSqlite/repositories/memberRepository";
import { DrizzleSqliteMenuRepository } from "@/core/adapters/drizzleSqlite/repositories/menuRepository";
import { DrizzleSqliteNotificationPreferenceRepository } from "@/core/adapters/drizzleSqlite/repositories/notificationPreferenceRepository";
import { DrizzleSqliteNotificationRepository } from "@/core/adapters/drizzleSqlite/repositories/notificationRepository";
import { DrizzleSqliteReservationRepository } from "@/core/adapters/drizzleSqlite/repositories/reservationRepository";
import { DrizzleSqliteShiftRepository } from "@/core/adapters/drizzleSqlite/repositories/shiftRepository";
import { DrizzleSqliteShiftRequestRepository } from "@/core/adapters/drizzleSqlite/repositories/shiftRequestRepository";
import { DrizzleSqliteStaffProfileRepository } from "@/core/adapters/drizzleSqlite/repositories/staffProfileRepository";
import { DrizzleSqliteTenantRepository } from "@/core/adapters/drizzleSqlite/repositories/tenantRepository";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Container } from "@/core/application/container/server";
import type { AuthEmailSender } from "@/core/domain/auth/ports/authEmailSender";

/**
 * Server configuration type
 */
export type ServerConfig = {
  databaseUrl: string;
  appUrl: string;
  authSecret: string;
};

/**
 * Read server configuration from environment variables
 */
function getServerConfig(): ServerConfig {
  const databaseUrl = process.env.SQLITE_URL;
  const appUrl = process.env.APP_URL;
  const authSecret = process.env.AUTH_SECRET;

  if (!databaseUrl) {
    throw new Error("SQLITE_URL environment variable is not set");
  }

  if (!appUrl) {
    throw new Error("APP_URL environment variable is not set");
  }

  if (!authSecret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }

  return {
    databaseUrl,
    appUrl,
    authSecret,
  };
}

/**
 * Create a DI container with the given configuration
 */
export function createContainer(config: ServerConfig): Container {
  const db = getDatabase(config.databaseUrl);
  const unitOfWorkProvider = new DrizzleSqliteUnitOfWorkProvider(db);

  const authEmailSender: AuthEmailSender = {
    sendVerificationEmail: async () => {
      console.warn("Verification email sending not implemented yet");
    },
    sendPasswordResetEmail: async () => {
      console.warn("Password reset email sending not implemented yet");
    },
  };

  const auth = createBetterAuth({
    db,
    baseURL: config.appUrl,
    secret: config.authSecret,
    authEmailSender,
  });

  return {
    config: {
      appUrl: config.appUrl,
      sessionTimeoutHours: 24,
      maxSessionsPerUser: 3,
    },
    unitOfWorkProvider,
    authProvider: new BetterAuthProvider(auth),
    customerRepository: new DrizzleSqliteCustomerRepository(db),
    tenantRepository: new DrizzleSqliteTenantRepository(db),
    memberRepository: new DrizzleSqliteMemberRepository(db),
    invitationRepository: new DrizzleSqliteInvitationRepository(db),
    menuRepository: new DrizzleSqliteMenuRepository(db),
    staffProfileRepository: new DrizzleSqliteStaffProfileRepository(db),
    shiftRepository: new DrizzleSqliteShiftRepository(db),
    shiftRequestRepository: new DrizzleSqliteShiftRequestRepository(db),
    reservationRepository: new DrizzleSqliteReservationRepository(db),
    notificationRepository: new DrizzleSqliteNotificationRepository(db),
    notificationPreferenceRepository:
      new DrizzleSqliteNotificationPreferenceRepository(db),
    memberEmailSender: {
      sendInvitationEmail: async () => {
        console.warn("Email sending not implemented yet");
      },
    },
    notificationEmailSender: {
      sendNotificationEmail: async () => {
        console.warn("Email sending not implemented yet");
      },
    },
  };
}

export const container = createContainer(getServerConfig());
