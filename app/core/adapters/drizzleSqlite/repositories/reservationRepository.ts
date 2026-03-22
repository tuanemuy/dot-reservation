import type { InferSelectModel } from "drizzle-orm";
import { and, eq, gte, like, lte, sql } from "drizzle-orm";
import { reservations } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { TimeOfDay as TimeOfDayType } from "@/core/domain/common/valueObject";
import type { CustomerId as CustomerIdType } from "@/core/domain/customer/valueObject";
import type { MenuId as MenuIdType } from "@/core/domain/menu/valueObject";
import type { Reservation as ReservationType } from "@/core/domain/reservation/entity";
import type {
  ReservationFilter,
  ReservationRepository,
} from "@/core/domain/reservation/ports/reservationRepository";
import type {
  CreatedBy,
  ReservationId as ReservationIdType,
  ReservationStatus as ReservationStatusType,
} from "@/core/domain/reservation/valueObject";
import type { StaffProfileId as StaffProfileIdType } from "@/core/domain/staff/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type ReservationDataModel = InferSelectModel<typeof reservations>;

export class DrizzleSqliteReservationRepository
  implements ReservationRepository
{
  constructor(private readonly executor: Executor) {}

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private into(data: ReservationDataModel): ReservationType {
    return {
      id: data.id as ReservationIdType,
      tenantId: data.tenantId as TenantIdType,
      customerId: (data.customerId as CustomerIdType) || null,
      menuId: data.menuId as MenuIdType,
      staffProfileId: (data.staffProfileId as StaffProfileIdType) || null,
      date: this.parseLocalDate(data.date),
      startTime: data.startTime as TimeOfDayType,
      endTime: data.endTime as TimeOfDayType,
      status: data.status as ReservationStatusType,
      menuName: data.menuName,
      menuDuration: data.menuDuration,
      menuPrice: data.menuPrice,
      staffName: data.staffName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhoneNumber: data.customerPhoneNumber,
      note: data.note,
      cancellationReason: data.cancellationReason,
      rejectionReason: data.rejectionReason,
      createdBy: data.createdBy as CreatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(reservation: ReservationType): Promise<void> {
    try {
      await this.executor
        .insert(reservations)
        .values({
          id: reservation.id,
          tenantId: reservation.tenantId,
          customerId: reservation.customerId,
          menuId: reservation.menuId,
          staffProfileId: reservation.staffProfileId,
          date: this.formatDate(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          status: reservation.status,
          menuName: reservation.menuName,
          menuDuration: reservation.menuDuration,
          menuPrice: reservation.menuPrice,
          staffName: reservation.staffName,
          customerName: reservation.customerName,
          customerEmail: reservation.customerEmail,
          customerPhoneNumber: reservation.customerPhoneNumber,
          note: reservation.note,
          cancellationReason: reservation.cancellationReason,
          rejectionReason: reservation.rejectionReason,
          createdBy: reservation.createdBy,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
        })
        .onConflictDoUpdate({
          target: reservations.id,
          set: {
            tenantId: reservation.tenantId,
            customerId: reservation.customerId,
            menuId: reservation.menuId,
            staffProfileId: reservation.staffProfileId,
            date: this.formatDate(reservation.date),
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            status: reservation.status,
            menuName: reservation.menuName,
            menuDuration: reservation.menuDuration,
            menuPrice: reservation.menuPrice,
            staffName: reservation.staffName,
            customerName: reservation.customerName,
            customerEmail: reservation.customerEmail,
            customerPhoneNumber: reservation.customerPhoneNumber,
            note: reservation.note,
            cancellationReason: reservation.cancellationReason,
            rejectionReason: reservation.rejectionReason,
            createdBy: reservation.createdBy,
            updatedAt: reservation.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save reservation",
        error,
      );
    }
  }

  async findById(id: ReservationIdType): Promise<ReservationType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(reservations)
        .where(eq(reservations.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservation by id",
        error,
      );
    }
  }

  private buildFilterConditions(filter: ReservationFilter) {
    const conditions = [];
    if (filter.status) {
      conditions.push(eq(reservations.status, filter.status));
    }
    if (filter.dateFrom) {
      conditions.push(gte(reservations.date, this.formatDate(filter.dateFrom)));
    }
    if (filter.dateTo) {
      conditions.push(lte(reservations.date, this.formatDate(filter.dateTo)));
    }
    return conditions;
  }

  async findByTenantId(
    tenantId: TenantIdType,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<ReservationType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [
        eq(reservations.tenantId, tenantId),
        ...this.buildFilterConditions(filter),
      ];
      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(reservations)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(reservations)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservations by tenant id",
        error,
      );
    }
  }

  async findByCustomerId(
    customerId: CustomerIdType,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<ReservationType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [
        eq(reservations.customerId, customerId),
        ...this.buildFilterConditions(filter),
      ];
      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(reservations)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(reservations)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservations by customer id",
        error,
      );
    }
  }

  async findByStaffProfileId(
    staffProfileId: StaffProfileIdType,
    filter: ReservationFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<ReservationType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [
        eq(reservations.staffProfileId, staffProfileId),
        ...this.buildFilterConditions(filter),
      ];
      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(reservations)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(reservations)
          .where(whereClause),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservations by staff profile id",
        error,
      );
    }
  }

  async findByTenantIdAndDateRange(
    tenantId: TenantIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ReservationType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            gte(reservations.date, this.formatDate(startDate)),
            lte(reservations.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservations by tenant id and date range",
        error,
      );
    }
  }

  async findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ReservationType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.staffProfileId, staffProfileId),
            gte(reservations.date, this.formatDate(startDate)),
            lte(reservations.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reservations by staff profile id and date range",
        error,
      );
    }
  }

  async countByCustomerIdAndStatusAndDateAfter(
    customerId: CustomerIdType,
    status: ReservationStatusType,
    date: Date,
  ): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(
          and(
            eq(reservations.customerId, customerId),
            eq(reservations.status, status),
            gte(reservations.date, this.formatDate(date)),
          ),
        );

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count reservations by customer id, status, and date",
        error,
      );
    }
  }

  async countByTenantId(tenantId: TenantIdType): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(eq(reservations.tenantId, tenantId));

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count reservations by tenant id",
        error,
      );
    }
  }

  async findConfirmedEndedBefore(before: Date): Promise<ReservationType[]> {
    try {
      const beforeDateStr = this.formatDate(before);
      const beforeHours = String(before.getHours()).padStart(2, "0");
      const beforeMinutes = String(before.getMinutes()).padStart(2, "0");
      const beforeTimeStr = `${beforeHours}:${beforeMinutes}`;

      // Find confirmed reservations where date < before date,
      // OR date = before date AND endTime <= before time
      const rows = await this.executor
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.status, "confirmed"),
            sql`(${reservations.date} < ${beforeDateStr} OR (${reservations.date} = ${beforeDateStr} AND ${reservations.endTime} <= ${beforeTimeStr}))`,
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find confirmed reservations ended before date",
        error,
      );
    }
  }

  async countByTenantIdAndMonth(
    tenantId: TenantIdType,
    year: number,
    month: number,
  ): Promise<number> {
    try {
      const monthStr = String(month).padStart(2, "0");
      const prefix = `${year}-${monthStr}`;

      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            like(reservations.date, `${prefix}%`),
          ),
        );

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count reservations by tenant id and month",
        error,
      );
    }
  }
}
