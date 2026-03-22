import type { InferSelectModel } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import { members } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type {
  Email as EmailType,
  PhoneNumber as PhoneNumberType,
} from "@/core/domain/common/valueObject";
import type { Member as MemberType } from "@/core/domain/member/entity";
import type { MemberRepository } from "@/core/domain/member/ports/memberRepository";
import type {
  MemberId as MemberIdType,
  MemberName as MemberNameType,
  MemberRole as MemberRoleType,
} from "@/core/domain/member/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type MemberDataModel = InferSelectModel<typeof members>;

export class DrizzleSqliteMemberRepository implements MemberRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: MemberDataModel): MemberType {
    return {
      id: data.id as MemberIdType,
      tenantId: data.tenantId as TenantIdType,
      authUserId: data.authUserId,
      name: data.name as MemberNameType,
      email: data.email as EmailType,
      phoneNumber: data.phoneNumber as PhoneNumberType | null,
      role: data.role as MemberRoleType,
      joinedAt: data.joinedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(member: MemberType): Promise<void> {
    try {
      await this.executor
        .insert(members)
        .values({
          id: member.id,
          tenantId: member.tenantId,
          authUserId: member.authUserId,
          name: member.name,
          email: member.email,
          phoneNumber: member.phoneNumber,
          role: member.role,
          joinedAt: member.joinedAt,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        })
        .onConflictDoUpdate({
          target: members.id,
          set: {
            tenantId: member.tenantId,
            authUserId: member.authUserId,
            name: member.name,
            email: member.email,
            phoneNumber: member.phoneNumber,
            role: member.role,
            joinedAt: member.joinedAt,
            updatedAt: member.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save member",
        error,
      );
    }
  }

  async findById(id: MemberIdType): Promise<MemberType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(members)
        .where(eq(members.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find member by id",
        error,
      );
    }
  }

  async findByTenantId(
    tenantId: TenantIdType,
    pagination: Pagination,
  ): Promise<PaginationResult<MemberType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const whereClause = eq(members.tenantId, tenantId);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(members)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(members)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find members by tenant id",
        error,
      );
    }
  }

  async findByAuthUserId(authUserId: string): Promise<MemberType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(members)
        .where(eq(members.authUserId, authUserId));

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find members by auth user id",
        error,
      );
    }
  }

  async findByTenantIdAndAuthUserId(
    tenantId: TenantIdType,
    authUserId: string,
  ): Promise<MemberType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(members)
        .where(
          and(
            eq(members.tenantId, tenantId),
            eq(members.authUserId, authUserId),
          ),
        )
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find member by tenant id and auth user id",
        error,
      );
    }
  }

  async countAdminsByTenantId(tenantId: TenantIdType): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(members)
        .where(and(eq(members.tenantId, tenantId), eq(members.role, "admin")));

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count admins by tenant id",
        error,
      );
    }
  }

  async delete(id: MemberIdType): Promise<void> {
    try {
      await this.executor.delete(members).where(eq(members.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete member",
        error,
      );
    }
  }
}
