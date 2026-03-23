import type { AuthProvider } from "@/core/domain/auth/ports/authProvider";
import type { CustomerRepository } from "@/core/domain/customer/ports/customerRepository";
import type { EmailSender as MemberEmailSender } from "@/core/domain/member/ports/emailSender";
import type { InvitationRepository } from "@/core/domain/member/ports/invitationRepository";
import type { MemberRepository } from "@/core/domain/member/ports/memberRepository";
import type { MenuRepository } from "@/core/domain/menu/ports/menuRepository";
import type { EmailSender as NotificationEmailSender } from "@/core/domain/notification/ports/emailSender";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type { ReservationRepository } from "@/core/domain/reservation/ports/reservationRepository";
import type { ShiftRepository } from "@/core/domain/shift/ports/shiftRepository";
import type { ShiftRequestRepository } from "@/core/domain/shift/ports/shiftRequestRepository";
import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import type { TenantRepository } from "@/core/domain/tenant/ports/tenantRepository";
import type { UnitOfWorkProvider } from "../unitOfWork";

/**
 * Application Configuration
 */
export type AppConfig = {
  appUrl: string;
  sessionTimeoutHours: number;
  maxSessionsPerUser: number;
};

/**
 * Dependency Injection Container
 */
export type Container = {
  config: AppConfig;
  unitOfWorkProvider: UnitOfWorkProvider;

  // Read-only repositories (for queries outside transactions)
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

  // Auth
  authProvider: AuthProvider;

  // External services
  memberEmailSender: MemberEmailSender;
  notificationEmailSender: NotificationEmailSender;
};
