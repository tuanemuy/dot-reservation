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
import { DrizzleSqliteOutboxRepository } from "@/core/adapters/drizzleSqlite/repositories/outboxRepository";
import { DrizzleSqliteReservationRepository } from "@/core/adapters/drizzleSqlite/repositories/reservationRepository";
import { DrizzleSqliteShiftRepository } from "@/core/adapters/drizzleSqlite/repositories/shiftRepository";
import { DrizzleSqliteShiftRequestRepository } from "@/core/adapters/drizzleSqlite/repositories/shiftRequestRepository";
import { DrizzleSqliteStaffProfileRepository } from "@/core/adapters/drizzleSqlite/repositories/staffProfileRepository";
import { DrizzleSqliteTenantRepository } from "@/core/adapters/drizzleSqlite/repositories/tenantRepository";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import { NodemailerAuthEmailSender } from "@/core/adapters/nodemailer/authEmailSender";
import {
  createTransporter,
  getSmtpConfig,
} from "@/core/adapters/nodemailer/client";
import { NodemailerMemberEmailSender } from "@/core/adapters/nodemailer/memberEmailSender";
import { NodemailerNotificationEmailSender } from "@/core/adapters/nodemailer/notificationEmailSender";
import { createS3Client, getS3Config } from "@/core/adapters/s3/client";
import { S3StorageManager } from "@/core/adapters/s3/storageManager";
import type { Container } from "@/core/application/container/server";

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
 * Create server-side dependencies with the given configuration
 */
function createDependencies(config: ServerConfig) {
  const db = getDatabase(config.databaseUrl);
  const unitOfWorkProvider = new DrizzleSqliteUnitOfWorkProvider(db);

  const smtpConfig = getSmtpConfig();
  const transporter = createTransporter(smtpConfig);

  const authEmailSender = new NodemailerAuthEmailSender(
    transporter,
    smtpConfig.from,
  );

  const auth = createBetterAuth({
    db,
    baseURL: config.appUrl,
    secret: config.authSecret,
    authEmailSender,
  });

  const s3Config = getS3Config();
  const s3Client = createS3Client(s3Config);

  const container: Container = {
    config: {
      appUrl: config.appUrl,
      sessionTimeoutHours: 24,
      maxSessionsPerUser: 3,
    },
    unitOfWorkProvider,
    authProvider: new BetterAuthProvider(auth, db),
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
    memberEmailSender: new NodemailerMemberEmailSender(
      transporter,
      smtpConfig.from,
      config.appUrl,
    ),
    notificationEmailSender: new NodemailerNotificationEmailSender(
      transporter,
      smtpConfig.from,
    ),
    storageManager: new S3StorageManager(
      s3Client,
      s3Config.bucketName,
      s3Config.region,
      s3Config.endpoint,
    ),
    outboxRepository: new DrizzleSqliteOutboxRepository(db),
  };

  return { container, auth };
}

const dependencies = createDependencies(getServerConfig());

export const container = dependencies.container;
export const auth = dependencies.auth;
