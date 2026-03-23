import type { Container } from "@/core/application/container/server";
import { createNotification } from "@/core/application/notification/createNotification";
import type { DomainEvent } from "@/core/domain/common/event";
import type { OutboxRepository } from "@/core/domain/common/ports/outboxRepository";
import type { Email } from "@/core/domain/common/valueObject";
import { InvitationId } from "@/core/domain/member/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";

type EventHandler = (container: Container, event: DomainEvent) => Promise<void>;

async function findAdminMembers(container: Container, tenantId: string) {
  const result = await container.memberRepository.findByTenantId(
    TenantId.create(tenantId),
    { page: 1, limit: 1000 },
  );
  return result.items.filter((m) => m.role === "admin");
}

const eventHandlers: Record<string, EventHandler> = {
  "reservation.created": async (container, event) => {
    const payload = event.payload as {
      reservationId: string;
      tenantId: string;
      customerId: string | null;
      status: string;
    };

    const admins = await findAdminMembers(container, payload.tenantId);
    for (const admin of admins) {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "member",
          recipientId: admin.id,
          type: "new_reservation",
          title: "新しい予約",
          message: "新しい予約が作成されました。",
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }

    if (payload.customerId && payload.status === "confirmed") {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "customer",
          recipientId: payload.customerId,
          type: "reservation_confirmed",
          title: "予約確定",
          message: "予約が確定しました。",
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }
  },

  "reservation.approved": async (container, event) => {
    const payload = event.payload as {
      reservationId: string;
      tenantId: string;
      customerId: string | null;
    };

    if (payload.customerId) {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "customer",
          recipientId: payload.customerId,
          type: "reservation_approved",
          title: "予約承認",
          message: "予約が承認されました。",
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }
  },

  "reservation.rejected": async (container, event) => {
    const payload = event.payload as {
      reservationId: string;
      tenantId: string;
      customerId: string | null;
      reason: string | null;
    };

    if (payload.customerId) {
      const reasonText = payload.reason ? `理由: ${payload.reason}` : "";
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "customer",
          recipientId: payload.customerId,
          type: "reservation_rejected",
          title: "予約不承認",
          message: `予約が承認されませんでした。${reasonText}`,
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }
  },

  "reservation.cancelled": async (container, event) => {
    const payload = event.payload as {
      reservationId: string;
      tenantId: string;
      customerId: string | null;
      cancelledBy: string;
      reason: string | null;
    };

    if (payload.customerId && payload.cancelledBy !== "customer") {
      const reasonText = payload.reason ? `理由: ${payload.reason}` : "";
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "customer",
          recipientId: payload.customerId,
          type: "reservation_cancelled",
          title: "予約キャンセル",
          message: `予約がキャンセルされました。${reasonText}`,
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }

    if (payload.cancelledBy === "customer") {
      const admins = await findAdminMembers(container, payload.tenantId);
      for (const admin of admins) {
        await createNotification({
          container,
          headers: new Headers(),
          input: {
            recipientType: "member",
            recipientId: admin.id,
            type: "reservation_cancelled_by_customer",
            title: "予約キャンセル",
            message: "お客様により予約がキャンセルされました。",
            referenceType: "reservation",
            referenceId: payload.reservationId,
          },
        });
      }
    }
  },

  "reservation.updated": async (container, event) => {
    const payload = event.payload as {
      reservationId: string;
      tenantId: string;
      customerId: string | null;
    };

    if (payload.customerId) {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "customer",
          recipientId: payload.customerId,
          type: "reservation_updated",
          title: "予約更新",
          message: "予約内容が更新されました。",
          referenceType: "reservation",
          referenceId: payload.reservationId,
        },
      });
    }
  },

  "invitation.created": async (container, event) => {
    const payload = event.payload as {
      invitationId: string;
      tenantId: string;
      email: string;
    };

    const invitation = await container.invitationRepository.findById(
      InvitationId.create(payload.invitationId),
    );
    if (!invitation) {
      return;
    }

    const tenant = await container.tenantRepository.findById(
      TenantId.create(payload.tenantId),
    );
    if (!tenant) {
      return;
    }

    await container.memberEmailSender.sendInvitationEmail(
      payload.email as Email,
      invitation,
      String(tenant.name),
    );
  },

  "invitation.resent": async (container, event) => {
    const payload = event.payload as {
      invitationId: string;
      tenantId: string;
      email: string;
    };

    const invitation = await container.invitationRepository.findById(
      InvitationId.create(payload.invitationId),
    );
    if (!invitation) {
      return;
    }

    const tenant = await container.tenantRepository.findById(
      TenantId.create(payload.tenantId),
    );
    if (!tenant) {
      return;
    }

    await container.memberEmailSender.sendInvitationEmail(
      payload.email as Email,
      invitation,
      String(tenant.name),
    );
  },

  "member.joined": async (container, event) => {
    const payload = event.payload as {
      memberId: string;
      tenantId: string;
      role: string;
    };

    const admins = await findAdminMembers(container, payload.tenantId);
    for (const admin of admins) {
      if (admin.id !== payload.memberId) {
        await createNotification({
          container,
          headers: new Headers(),
          input: {
            recipientType: "member",
            recipientId: admin.id,
            type: "member_joined",
            title: "メンバー参加",
            message: "新しいメンバーが参加しました。",
            referenceType: "member",
            referenceId: payload.memberId,
          },
        });
      }
    }
  },

  "member.removed": async (container, event) => {
    const payload = event.payload as {
      memberId: string;
      tenantId: string;
    };

    const admins = await findAdminMembers(container, payload.tenantId);
    for (const admin of admins) {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "member",
          recipientId: admin.id,
          type: "member_removed",
          title: "メンバー除名",
          message: "メンバーがテナントから除名されました。",
          referenceType: "member",
          referenceId: payload.memberId,
        },
      });
    }
  },

  "shiftRequest.submitted": async (container, event) => {
    const payload = event.payload as {
      staffProfileId: string;
      tenantId: string;
    };

    const admins = await findAdminMembers(container, payload.tenantId);
    for (const admin of admins) {
      await createNotification({
        container,
        headers: new Headers(),
        input: {
          recipientType: "member",
          recipientId: admin.id,
          type: "shift_request_submitted",
          title: "シフト希望提出",
          message: "スタッフからシフト希望が提出されました。",
          referenceType: "staffProfile",
          referenceId: payload.staffProfileId,
        },
      });
    }
  },
};

export async function processOutboxEvents(
  container: Container,
  outboxRepository: OutboxRepository,
): Promise<number> {
  const pendingEvents = await outboxRepository.findPendingEvents(100);
  let processedCount = 0;

  for (const entry of pendingEvents) {
    const handler = eventHandlers[entry.event.type];
    if (handler) {
      await handler(container, entry.event);
    }
    await outboxRepository.markAsProcessed(entry.id);
    processedCount += 1;
  }

  return processedCount;
}
