import type { WithEvents } from "@/core/domain/common/event";
import type { Email, PhoneNumber } from "@/core/domain/common/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import { MemberErrorCode } from "./errorCode";
import { type MemberEvent, MemberEvents } from "./events";
import type {
  InvitationId as InvitationIdType,
  InvitationStatus as InvitationStatusType,
  MemberId as MemberIdType,
  MemberName as MemberNameType,
  MemberRole as MemberRoleType,
} from "./valueObject";
import { InvitationId, MemberId, MemberName } from "./valueObject";

// Member型定義
type Member = Readonly<{
  id: MemberIdType;
  tenantId: TenantId;
  authUserId: string;
  name: MemberNameType;
  email: Email;
  phoneNumber: PhoneNumber | null;
  role: MemberRoleType;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { Member };

export const Member = {
  create: (params: {
    tenantId: TenantId;
    authUserId: string;
    name: string;
    email: Email;
    phoneNumber: PhoneNumber | null;
    role: MemberRoleType;
  }): WithEvents<Member, MemberEvent> => {
    const now = new Date();
    const member: Member = {
      id: MemberId.generate(),
      tenantId: params.tenantId,
      authUserId: params.authUserId,
      name: MemberName.create(params.name),
      email: params.email,
      phoneNumber: params.phoneNumber,
      role: params.role,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: member,
      events: [MemberEvents.joined(member.id, member.tenantId, member.role)],
    };
  },

  updateProfile: (
    member: Member,
    params: {
      name?: string;
      email?: Email;
      phoneNumber?: PhoneNumber | null;
    },
  ): WithEvents<Member, MemberEvent> => {
    return {
      entity: {
        ...member,
        name:
          params.name !== undefined
            ? MemberName.create(params.name)
            : member.name,
        email: params.email !== undefined ? params.email : member.email,
        phoneNumber:
          params.phoneNumber !== undefined
            ? params.phoneNumber
            : member.phoneNumber,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  changeRole: (
    member: Member,
    newRole: MemberRoleType,
  ): WithEvents<Member, MemberEvent> => {
    const oldRole = member.role;
    return {
      entity: {
        ...member,
        role: newRole,
        updatedAt: new Date(),
      },
      events: [
        MemberEvents.roleChanged(member.id, member.tenantId, oldRole, newRole),
      ],
    };
  },

  isAdmin: (member: Member): boolean => member.role === "admin",

  isStaff: (member: Member): boolean => member.role === "staff",
};

// Invitation型定義
type Invitation = Readonly<{
  id: InvitationIdType;
  tenantId: TenantId;
  email: Email;
  role: MemberRoleType;
  invitedBy: MemberIdType;
  status: InvitationStatusType;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

export type { Invitation };

export const Invitation = {
  create: (params: {
    tenantId: TenantId;
    email: Email;
    role: MemberRoleType;
    invitedBy: MemberIdType;
    expiresAt: Date;
  }): WithEvents<Invitation, MemberEvent> => {
    const now = new Date();
    const invitation: Invitation = {
      id: InvitationId.generate(),
      tenantId: params.tenantId,
      email: params.email,
      role: params.role,
      invitedBy: params.invitedBy,
      status: "pending",
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: invitation,
      events: [
        MemberEvents.invitationCreated(
          invitation.id,
          invitation.tenantId,
          invitation.email,
        ),
      ],
    };
  },

  accept: (invitation: Invitation): WithEvents<Invitation, MemberEvent> => {
    if (invitation.status !== "pending") {
      throw new BusinessRuleError(
        MemberErrorCode.InvitationNotPending,
        "Only pending invitations can be accepted",
      );
    }
    if (Invitation.isExpired(invitation)) {
      throw new BusinessRuleError(
        MemberErrorCode.InvitationExpired,
        "Invitation has expired",
      );
    }

    return {
      entity: {
        ...invitation,
        status: "accepted",
        updatedAt: new Date(),
      },
      events: [
        MemberEvents.invitationAccepted(invitation.id, invitation.tenantId),
      ],
    };
  },

  decline: (invitation: Invitation): WithEvents<Invitation, MemberEvent> => {
    if (invitation.status !== "pending") {
      throw new BusinessRuleError(
        MemberErrorCode.InvitationNotPending,
        "Only pending invitations can be declined",
      );
    }

    return {
      entity: {
        ...invitation,
        status: "declined",
        updatedAt: new Date(),
      },
      events: [
        MemberEvents.invitationDeclined(invitation.id, invitation.tenantId),
      ],
    };
  },

  cancel: (invitation: Invitation): WithEvents<Invitation, MemberEvent> => {
    if (invitation.status !== "pending") {
      throw new BusinessRuleError(
        MemberErrorCode.InvitationNotPending,
        "Only pending invitations can be cancelled",
      );
    }

    return {
      entity: {
        ...invitation,
        status: "cancelled",
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  isExpired: (invitation: Invitation): boolean => {
    return new Date() > invitation.expiresAt;
  },

  isPending: (invitation: Invitation): boolean => {
    return invitation.status === "pending" && !Invitation.isExpired(invitation);
  },
};
