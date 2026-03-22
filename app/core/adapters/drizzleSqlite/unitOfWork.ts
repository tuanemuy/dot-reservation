import type {
  Repositories,
  TransactionContext,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Executor } from "./client";
import { DrizzleSqliteCustomerRepository } from "./repositories/customerRepository";
import { DrizzleSqliteInvitationRepository } from "./repositories/invitationRepository";
import { DrizzleSqliteMemberRepository } from "./repositories/memberRepository";
import { DrizzleSqliteMenuRepository } from "./repositories/menuRepository";
import { DrizzleSqliteNotificationPreferenceRepository } from "./repositories/notificationPreferenceRepository";
import { DrizzleSqliteNotificationRepository } from "./repositories/notificationRepository";
import { DrizzleSqliteOutboxRepository } from "./repositories/outboxRepository";
import { DrizzleSqliteReservationRepository } from "./repositories/reservationRepository";
import { DrizzleSqliteShiftRepository } from "./repositories/shiftRepository";
import { DrizzleSqliteShiftRequestRepository } from "./repositories/shiftRequestRepository";
import { DrizzleSqliteStaffProfileRepository } from "./repositories/staffProfileRepository";
import { DrizzleSqliteTenantRepository } from "./repositories/tenantRepository";

/**
 * Configuration for transaction retry behavior
 */
type TransactionRetryConfig = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_RETRY_CONFIG: TransactionRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

/**
 * Check if an error is retryable (database lock/busy errors)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // SQLite BUSY and LOCKED errors
    return (
      message.includes("sqlite_busy") ||
      message.includes("database is locked") ||
      message.includes("database is busy") ||
      message.includes("cannot start a transaction within a transaction")
    );
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateRetryDelay(
  attempt: number,
  config: TransactionRetryConfig,
): number {
  const exponentialDelay = config.baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * config.baseDelayMs;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Sleep for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  private readonly retryConfig: TransactionRetryConfig;

  constructor(
    private readonly db: Database,
    retryConfig?: Partial<TransactionRetryConfig>,
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeTransaction(fn);
      } catch (error) {
        lastError = error;

        if (isRetryableError(error) && attempt < this.retryConfig.maxRetries) {
          const delay = calculateRetryDelay(attempt, this.retryConfig);
          await sleep(delay);
          continue;
        }

        throw error;
      }
    }

    // This should not be reached, but TypeScript requires it
    throw lastError;
  }

  private async executeTransaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      // Create repositories with transaction executor
      const repositories = createRepositories(tx as Executor);

      // Create transaction context with event collector
      const ctx: TransactionContext = {
        ...repositories,
      };

      // Execute the transaction function
      return await fn(ctx);
    });
  }
}

/**
 * Create all repositories with the given database executor
 */
function createRepositories(db: Executor): Repositories {
  return {
    outboxRepository: new DrizzleSqliteOutboxRepository(db),
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
  };
}
