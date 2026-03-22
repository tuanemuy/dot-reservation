import type { OutboxRepository } from "@/core/domain/common/ports/outboxRepository";
import type { CustomerRepository } from "@/core/domain/customer/ports/customerRepository";
import type { InvitationRepository } from "@/core/domain/member/ports/invitationRepository";
import type { MemberRepository } from "@/core/domain/member/ports/memberRepository";
import type { MenuRepository } from "@/core/domain/menu/ports/menuRepository";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type { ReservationRepository } from "@/core/domain/reservation/ports/reservationRepository";
import type { ShiftRepository } from "@/core/domain/shift/ports/shiftRepository";
import type { ShiftRequestRepository } from "@/core/domain/shift/ports/shiftRequestRepository";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import type { TenantRepository } from "@/core/domain/tenant/ports/tenantRepository";

export type Repositories = {
  outboxRepository: OutboxRepository;
  customerRepository: CustomerRepository;
  tenantRepository: TenantRepository;
  memberRepository: MemberRepository;
  invitationRepository: InvitationRepository;
  menuRepository: MenuRepository;
  staffProfileRepository: StaffProfileRepository;
  shiftRepository: ShiftRepository;
  shiftRequestRepository: ShiftRequestRepository;
  reservationRepository: ReservationRepository;
  notificationRepository: NotificationRepository;
  notificationPreferenceRepository: NotificationPreferenceRepository;
};

/**
 * Repositories with event collector for transaction context
 */
export type TransactionContext = Repositories;

export interface UnitOfWorkProvider {
  /**
   * Execute a transaction with automatic event collection and persistence.
   * Events added to the eventCollector are automatically saved to the Outbox
   * as part of the transaction.
   */
  transaction<T>(fn: (context: TransactionContext) => Promise<T>): Promise<T>;
}
