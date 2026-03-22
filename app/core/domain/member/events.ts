import type { DomainEventBase } from "@/core/domain/common/event";
import type { Email } from "@/core/domain/common/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";
import type { InvitationId, MemberId, MemberRole } from "./valueObject";

export type MemberJoinedEvent = DomainEventBase<
  "member.joined",
  { memberId: MemberId; tenantId: TenantId; role: MemberRole }
>;

export type MemberRemovedEvent = DomainEventBase<
  "member.removed",
  { memberId: MemberId; tenantId: TenantId }
>;

export type MemberRoleChangedEvent = DomainEventBase<
  "member.roleChanged",
  {
    memberId: MemberId;
    tenantId: TenantId;
    oldRole: MemberRole;
    newRole: MemberRole;
  }
>;

export type InvitationCreatedEvent = DomainEventBase<
  "invitation.created",
  { invitationId: InvitationId; tenantId: TenantId; email: Email }
>;

export type InvitationAcceptedEvent = DomainEventBase<
  "invitation.accepted",
  { invitationId: InvitationId; tenantId: TenantId }
>;

export type InvitationDeclinedEvent = DomainEventBase<
  "invitation.declined",
  { invitationId: InvitationId; tenantId: TenantId }
>;

export type InvitationResentEvent = DomainEventBase<
  "invitation.resent",
  { invitationId: InvitationId; tenantId: TenantId; email: Email }
>;

export type MemberEvent =
  | MemberJoinedEvent
  | MemberRemovedEvent
  | MemberRoleChangedEvent
  | InvitationCreatedEvent
  | InvitationAcceptedEvent
  | InvitationDeclinedEvent
  | InvitationResentEvent;

export const MemberEvents = {
  joined: (
    memberId: MemberId,
    tenantId: TenantId,
    role: MemberRole,
  ): MemberJoinedEvent => ({
    type: "member.joined",
    payload: { memberId, tenantId, role },
    occurredAt: new Date(),
  }),

  removed: (memberId: MemberId, tenantId: TenantId): MemberRemovedEvent => ({
    type: "member.removed",
    payload: { memberId, tenantId },
    occurredAt: new Date(),
  }),

  roleChanged: (
    memberId: MemberId,
    tenantId: TenantId,
    oldRole: MemberRole,
    newRole: MemberRole,
  ): MemberRoleChangedEvent => ({
    type: "member.roleChanged",
    payload: { memberId, tenantId, oldRole, newRole },
    occurredAt: new Date(),
  }),

  invitationCreated: (
    invitationId: InvitationId,
    tenantId: TenantId,
    email: Email,
  ): InvitationCreatedEvent => ({
    type: "invitation.created",
    payload: { invitationId, tenantId, email },
    occurredAt: new Date(),
  }),

  invitationAccepted: (
    invitationId: InvitationId,
    tenantId: TenantId,
  ): InvitationAcceptedEvent => ({
    type: "invitation.accepted",
    payload: { invitationId, tenantId },
    occurredAt: new Date(),
  }),

  invitationDeclined: (
    invitationId: InvitationId,
    tenantId: TenantId,
  ): InvitationDeclinedEvent => ({
    type: "invitation.declined",
    payload: { invitationId, tenantId },
    occurredAt: new Date(),
  }),

  invitationResent: (
    invitationId: InvitationId,
    tenantId: TenantId,
    email: Email,
  ): InvitationResentEvent => ({
    type: "invitation.resent",
    payload: { invitationId, tenantId, email },
    occurredAt: new Date(),
  }),
};
