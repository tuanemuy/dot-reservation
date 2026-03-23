// app/core/application/__tests__/helpers.ts
// Test helper functions for application service tests

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach } from "vitest";
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
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Container } from "@/core/application/container/server";
import type { AuthProvider } from "@/core/domain/auth/ports/authProvider";
import type { EmailSender as MemberEmailSender } from "@/core/domain/member/ports/emailSender";
import type { EmailSender as NotificationEmailSender } from "@/core/domain/notification/ports/emailSender";
import type { StorageManager } from "@/core/domain/staff/ports/storageManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Test Database
// ============================================

/**
 * Test database instance
 */
export type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Test database with cleanup function
 */
export type TestDatabaseWithCleanup = {
  db: TestDatabase;
  dbPath: string;
  cleanup: () => void;
};

/**
 * Create a test database (file-based SQLite)
 * Each call creates a new isolated database instance using a temporary file.
 *
 * Note: We use file-based SQLite instead of :memory: because libsql's
 * transaction implementation resets the db connection after each transaction,
 * which causes in-memory databases to lose their state between transactions.
 */
export async function createTestDatabase(): Promise<TestDatabaseWithCleanup> {
  // Create a unique temporary file for this test database
  const dbPath = path.join(
    os.tmpdir(),
    `test-db-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
  );
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client, { schema });

  // Apply migrations
  const migrationsFolder = path.join(
    __dirname,
    "../../adapters/drizzleSqlite/migrations",
  );
  await migrate(db, { migrationsFolder });

  return {
    db,
    dbPath,
    cleanup: () => {
      try {
        fs.unlinkSync(dbPath);
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

// ============================================
// Test Container
// ============================================

/**
 * Test container configuration options
 */
export type TestContainerOptions = {
  /**
   * Override the default config
   */
  config?: Partial<Container["config"]>;
  /**
   * Custom database instance (if not provided, a new file-based DB is created)
   */
  dbWithCleanup?: TestDatabaseWithCleanup;
};

/**
 * Test container with additional test utilities
 */
export type TestContainer = Container & {
  /**
   * Direct database access for test setup/assertions
   */
  db: TestDatabase;
  /**
   * Clean up test resources
   */
  cleanup: () => Promise<void>;
};

/**
 * Create a test container with real adapters (where possible) and mocks for external services
 */
export async function createTestContainer(
  options: TestContainerOptions = {},
): Promise<TestContainer> {
  const dbWithCleanup = options.dbWithCleanup ?? (await createTestDatabase());

  const container: TestContainer = {
    config: {
      appUrl: "http://localhost:3000",
      sessionTimeoutHours: 24,
      maxSessionsPerUser: 3,
      ...options.config,
    },
    unitOfWorkProvider: new DrizzleSqliteUnitOfWorkProvider(dbWithCleanup.db),
    customerRepository: new DrizzleSqliteCustomerRepository(dbWithCleanup.db),
    tenantRepository: new DrizzleSqliteTenantRepository(dbWithCleanup.db),
    memberRepository: new DrizzleSqliteMemberRepository(dbWithCleanup.db),
    invitationRepository: new DrizzleSqliteInvitationRepository(
      dbWithCleanup.db,
    ),
    menuRepository: new DrizzleSqliteMenuRepository(dbWithCleanup.db),
    staffProfileRepository: new DrizzleSqliteStaffProfileRepository(
      dbWithCleanup.db,
    ),
    shiftRepository: new DrizzleSqliteShiftRepository(dbWithCleanup.db),
    shiftRequestRepository: new DrizzleSqliteShiftRequestRepository(
      dbWithCleanup.db,
    ),
    reservationRepository: new DrizzleSqliteReservationRepository(
      dbWithCleanup.db,
    ),
    notificationRepository: new DrizzleSqliteNotificationRepository(
      dbWithCleanup.db,
    ),
    notificationPreferenceRepository:
      new DrizzleSqliteNotificationPreferenceRepository(dbWithCleanup.db),
    authProvider: {
      getSession: async () => null,
      deleteUser: async () => {},
      banUser: async () => {},
      unbanUser: async () => {},
      getLastLoginAt: async () => null,
      verifyPassword: async () => false,
    } as AuthProvider,
    memberEmailSender: {
      sendInvitationEmail: async () => {},
    } as MemberEmailSender,
    notificationEmailSender: {
      sendNotificationEmail: async () => {},
    } as NotificationEmailSender,
    storageManager: {
      uploadImage: async () => "https://example.com/test-image.png",
      deleteImage: async () => {},
    } as StorageManager,
    outboxRepository: new DrizzleSqliteOutboxRepository(dbWithCleanup.db),
    // Test utilities
    db: dbWithCleanup.db,
    cleanup: async () => {
      // Clean up the temporary database file
      dbWithCleanup.cleanup();
    },
  };

  return container;
}

/**
 * Setup test container with automatic cleanup
 *
 * This function sets up beforeEach/afterEach hooks to create and cleanup
 * the test container automatically. Use the returned getter function to
 * access the container in your tests.
 *
 * @example
 * ```typescript
 * const getContainer = setupTestContainer();
 *
 * it("should do something", async () => {
 *   const container = getContainer();
 *   // use container...
 * });
 * ```
 */
export function setupTestContainer(
  options: TestContainerOptions = {},
): () => TestContainer {
  let container: TestContainer;

  beforeEach(async () => {
    container = await createTestContainer(options);
  });

  afterEach(async () => {
    await container.cleanup();
  });

  return () => container;
}

// ============================================
// Mock Headers
// ============================================

/**
 * Create mock headers for testing
 */
export function createMockHeaders(headers?: Record<string, string>): Headers {
  const h = new Headers();
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      h.set(key, value);
    }
  }
  return h;
}

// ============================================
// Test Data Factories
// ============================================
