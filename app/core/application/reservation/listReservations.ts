import { CustomerId } from "@/core/domain/customer/valueObject";
import type { Reservation } from "@/core/domain/reservation/entity";
import { ReservationStatus } from "@/core/domain/reservation/valueObject";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";
import type { Repositories } from "../unitOfWork";

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
  tenantName: string | null;
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

function toReservationSummary(
  reservation: {
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
  },
  tenantName: string | null,
): ReservationSummary {
  return {
    id: reservation.id,
    tenantId: reservation.tenantId,
    tenantName,
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

async function buildTenantNameMap(
  items: readonly Reservation[],
  repositories: Repositories,
): Promise<ReadonlyMap<string, string>> {
  const uniqueTenantIds = [...new Set(items.map((item) => item.tenantId))];
  const results = await Promise.all(
    uniqueTenantIds.map(async (tenantId) => {
      const tenant = await repositories.tenantRepository.findById(tenantId);
      return {
        tenantId: tenantId as string,
        name: tenant?.name as string | undefined,
      };
    }),
  );
  const map = new Map<string, string>();
  for (const { tenantId, name } of results) {
    if (name !== undefined) {
      map.set(tenantId, name);
    }
  }
  return map;
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

  const { result, tenantNameMap } =
    await container.unitOfWorkProvider.transaction(async (repositories) => {
      if (input.customerId) {
        const customerId = CustomerId.create(input.customerId);
        const r = await repositories.reservationRepository.findByCustomerId(
          customerId,
          filter,
          pagination,
        );
        const nameMap = await buildTenantNameMap(r.items, repositories);
        return { result: r, tenantNameMap: nameMap };
      }

      if (input.staffProfileId) {
        const staffProfileId = StaffProfileId.create(input.staffProfileId);
        const r = await repositories.reservationRepository.findByStaffProfileId(
          staffProfileId,
          filter,
          pagination,
        );
        const nameMap = await buildTenantNameMap(r.items, repositories);
        return { result: r, tenantNameMap: nameMap };
      }

      if (input.tenantId) {
        const tenantId = TenantId.create(input.tenantId);
        const r = await repositories.reservationRepository.findByTenantId(
          tenantId,
          filter,
          pagination,
        );
        const nameMap = await buildTenantNameMap(r.items, repositories);
        return { result: r, tenantNameMap: nameMap };
      }

      return {
        result: { items: [] as const, total: 0 },
        tenantNameMap: new Map<string, string>(),
      };
    });

  return {
    items: result.items.map((item) =>
      toReservationSummary(item, tenantNameMap.get(item.tenantId) ?? null),
    ),
    totalCount: result.total,
  };
}
