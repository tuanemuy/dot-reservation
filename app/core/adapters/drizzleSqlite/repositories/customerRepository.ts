import type { InferSelectModel } from "drizzle-orm";
import { and, eq, like, or, sql } from "drizzle-orm";
import { customers } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type {
  Email as EmailType,
  PhoneNumber as PhoneNumberType,
} from "@/core/domain/common/valueObject";
import type { Customer as CustomerType } from "@/core/domain/customer/entity";
import type {
  CustomerFilter,
  CustomerRepository,
} from "@/core/domain/customer/ports/customerRepository";
import type {
  CustomerDisplayName as CustomerDisplayNameType,
  CustomerId as CustomerIdType,
} from "@/core/domain/customer/valueObject";
import type { Executor } from "../client";

type CustomerDataModel = InferSelectModel<typeof customers>;

export class DrizzleSqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: CustomerDataModel): CustomerType {
    return {
      id: data.id as CustomerIdType,
      authUserId: data.authUserId,
      displayName: data.displayName as CustomerDisplayNameType,
      email: data.email as EmailType,
      phoneNumber: data.phoneNumber as PhoneNumberType | null,
      status: data.status as "active" | "suspended",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as CustomerType;
  }

  async save(customer: CustomerType): Promise<void> {
    try {
      await this.executor
        .insert(customers)
        .values({
          id: customer.id,
          authUserId: customer.authUserId,
          displayName: customer.displayName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          status: customer.status,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        })
        .onConflictDoUpdate({
          target: customers.id,
          set: {
            authUserId: customer.authUserId,
            displayName: customer.displayName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            status: customer.status,
            updatedAt: customer.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save customer",
        error,
      );
    }
  }

  async findById(id: CustomerIdType): Promise<CustomerType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find customer by id",
        error,
      );
    }
  }

  async findByAuthUserId(authUserId: string): Promise<CustomerType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(customers)
        .where(eq(customers.authUserId, authUserId))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find customer by auth user id",
        error,
      );
    }
  }

  async findByEmail(email: EmailType): Promise<CustomerType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find customer by email",
        error,
      );
    }
  }

  async findAll(
    filter: CustomerFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<CustomerType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [];
      if (filter.status) {
        conditions.push(eq(customers.status, filter.status));
      }
      if (filter.keyword) {
        const pattern = `%${filter.keyword}%`;
        conditions.push(
          or(
            like(customers.displayName, pattern),
            like(customers.email, pattern),
          ),
        );
      }
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(customers)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find customers",
        error,
      );
    }
  }

  async delete(id: CustomerIdType): Promise<void> {
    try {
      await this.executor.delete(customers).where(eq(customers.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete customer",
        error,
      );
    }
  }
}
