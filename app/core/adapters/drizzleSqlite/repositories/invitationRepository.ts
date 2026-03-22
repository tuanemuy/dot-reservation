import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { invitations } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Email as EmailType } from "@/core/domain/common/valueObject";
import type { Invitation as InvitationType } from "@/core/domain/member/entity";
import type { InvitationRepository } from "@/core/domain/member/ports/invitationRepository";
import type {
  InvitationId as InvitationIdType,
  InvitationStatus as InvitationStatusType,
  MemberId as MemberIdType,
  MemberRole as MemberRoleType,
} from "@/core/domain/member/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type InvitationDataModel = InferSelectModel<typeof invitations>;

export class DrizzleSqliteInvitationRepository implements InvitationRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: InvitationDataModel): InvitationType {
    return {
      id: data.id as InvitationIdType,
      tenantId: data.tenantId as TenantIdType,
      email: data.email as EmailType,
      role: data.role as MemberRoleType,
      invitedBy: data.invitedBy as MemberIdType,
      status: data.status as InvitationStatusType,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(invitation: InvitationType): Promise<void> {
    try {
      await this.executor
        .insert(invitations)
        .values({
          id: invitation.id,
          tenantId: invitation.tenantId,
          email: invitation.email,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          updatedAt: invitation.updatedAt,
        })
        .onConflictDoUpdate({
          target: invitations.id,
          set: {
            tenantId: invitation.tenantId,
            email: invitation.email,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            updatedAt: invitation.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save invitation",
        error,
      );
    }
  }

  async findById(id: InvitationIdType): Promise<InvitationType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(invitations)
        .where(eq(invitations.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find invitation by id",
        error,
      );
    }
  }

  async findByTenantId(tenantId: TenantIdType): Promise<InvitationType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(invitations)
        .where(eq(invitations.tenantId, tenantId));

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find invitations by tenant id",
        error,
      );
    }
  }

  async findPendingByEmail(email: EmailType): Promise<InvitationType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(invitations)
        .where(
          and(eq(invitations.email, email), eq(invitations.status, "pending")),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find pending invitations by email",
        error,
      );
    }
  }

  async findByInvitedBy(memberId: MemberIdType): Promise<InvitationType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(invitations)
        .where(eq(invitations.invitedBy, memberId));

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find invitations by invited by",
        error,
      );
    }
  }

  async delete(id: InvitationIdType): Promise<void> {
    try {
      await this.executor.delete(invitations).where(eq(invitations.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete invitation",
        error,
      );
    }
  }
}
