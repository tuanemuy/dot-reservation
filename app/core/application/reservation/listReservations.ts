import { CustomerId } from "@/core/domain/customer/valueObject";
import { ReservationStatus } from "@/core/domain/reservation/valueObject";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type ListReservationsInput = {
  tenantId?: string;
  customerId?: string;
  staffProfileId?: string;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  page: number;
  limit: number;
};

export type ReservationSummary = {
  id: string;
  tenantId: string;
  customerId: string | null;
  menuName: string;
  menuDuration: number;
  menuPrice: number;
  staffName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  createdBy: string;
  createdAt: Date;
};

export type ListReservationsOutput = {
  items: ReservationSummary[];
  totalCount: number;
};

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toReservationSummary(reservation: {
  id: string;
  tenantId: string;
  customerId: string | null;
  menuName: string;
  menuDuration: number;
  menuPrice: number;
  staffName: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  createdBy: string;
  createdAt: Date;
}): ReservationSummary {
  return {
    id: reservation.id,
    tenantId: reservation.tenantId,
    customerId: reservation.customerId,
    menuName: reservation.menuName,
    menuDuration: reservation.menuDuration,
    menuPrice: reservation.menuPrice,
    staffName: reservation.staffName,
    date: formatDate(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    customerName: reservation.customerName,
    createdBy: reservation.createdBy,
    createdAt: reservation.createdAt,
  };
}

export async function listReservations({
  container,
  input,
}: ServiceArgs<ListReservationsInput>): Promise<ListReservationsOutput> {
  const filter = {
    status: input.status ? ReservationStatus.create(input.status) : undefined,
    dateFrom: input.startDate ? parseDate(input.startDate) : undefined,
    dateTo: input.endDate ? parseDate(input.endDate) : undefined,
  };

  const pagination = {
    page: input.page,
    limit: input.limit,
  };

  if (input.customerId) {
    const customerId = CustomerId.create(input.customerId);
    const result = await container.reservationRepository.findByCustomerId(
      customerId,
      filter,
      pagination,
    );
    return {
      items: result.items.map(toReservationSummary),
      totalCount: result.total,
    };
  }

  if (input.staffProfileId) {
    const staffProfileId = StaffProfileId.create(input.staffProfileId);
    const result = await container.reservationRepository.findByStaffProfileId(
      staffProfileId,
      filter,
      pagination,
    );
    return {
      items: result.items.map(toReservationSummary),
      totalCount: result.total,
    };
  }

  if (input.tenantId) {
    const tenantId = TenantId.create(input.tenantId);
    const result = await container.reservationRepository.findByTenantId(
      tenantId,
      filter,
      pagination,
    );
    return {
      items: result.items.map(toReservationSummary),
      totalCount: result.total,
    };
  }

  return {
    items: [],
    totalCount: 0,
  };
}
