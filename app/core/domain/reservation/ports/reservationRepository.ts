import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { CustomerId } from "@/core/domain/customer/valueObject";
import type { Reservation } from "@/core/domain/reservation/entity";
import type {
  ReservationId,
  ReservationStatus,
} from "@/core/domain/reservation/valueObject";
import type { StaffProfileId } from "@/core/domain/staff/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export type ReservationFilter = {
  readonly status?: ReservationStatus;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
};

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: ReservationId): Promise<Reservation | null>;
  findByTenantId(
    tenantId: TenantId,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Reservation>>;
  findByCustomerId(
    customerId: CustomerId,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Reservation>>;
  findByStaffProfileId(
    staffProfileId: StaffProfileId,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Reservation>>;
  findByTenantIdAndDateRange(
    tenantId: TenantId,
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]>;
  findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileId,
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]>;
  countByCustomerIdAndStatusAndDateAfter(
    customerId: CustomerId,
    status: ReservationStatus,
    date: Date,
  ): Promise<number>;
  countByTenantId(tenantId: TenantId): Promise<number>;
  countByTenantIdAndMonth(
    tenantId: TenantId,
    year: number,
    month: number,
  ): Promise<number>;
  findConfirmedEndedBefore(before: Date): Promise<Reservation[]>;
}
