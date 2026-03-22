import type { InferSelectModel } from "drizzle-orm";
import { and, eq, like, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import {
  invitations,
  members,
  menus,
  reservations,
  shiftRequests,
  shifts,
  staffAssignedMenus,
  staffProfiles,
  temporaryHolidays,
  tenants,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type {
  DayOfWeek as DayOfWeekType,
  PhoneNumber as PhoneNumberType,
  PostalCode as PostalCodeType,
} from "@/core/domain/common/valueObject";
import type { Tenant as TenantType } from "@/core/domain/tenant/entity";
import type {
  TenantFilter,
  TenantRepository,
} from "@/core/domain/tenant/ports/tenantRepository";
import type {
  ApprovalMethod as ApprovalMethodType,
  BusinessHours as BusinessHoursType,
  TenantCategory as TenantCategoryType,
  TenantDescription as TenantDescriptionType,
  TenantId as TenantIdType,
  TenantName as TenantNameType,
  TenantStatus as TenantStatusType,
  TenantUrlPath as TenantUrlPathType,
} from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type TenantDataModel = InferSelectModel<typeof tenants>;
type TemporaryHolidayDataModel = InferSelectModel<typeof temporaryHolidays>;

export class DrizzleSqliteTenantRepository implements TenantRepository {
  constructor(private readonly executor: Executor) {}

  private into(
    data: TenantDataModel,
    holidays: TemporaryHolidayDataModel[],
  ): TenantType {
    const imageUrls: string[] = JSON.parse(data.imageUrls);
    const businessHours: BusinessHoursType = JSON.parse(data.businessHours);
    const regularHolidays: DayOfWeekType[] = JSON.parse(data.regularHolidays);

    return {
      id: data.id as TenantIdType,
      name: data.name as TenantNameType,
      category: data.category as TenantCategoryType,
      urlPath: data.urlPath as TenantUrlPathType,
      postalCode: data.postalCode as PostalCodeType,
      address: {
        prefecture: data.addressPrefecture,
        city: data.addressCity,
        street: data.addressStreet,
      },
      phoneNumber: data.phoneNumber as PhoneNumberType,
      description: data.description as TenantDescriptionType | null,
      imageUrls,
      businessHours,
      regularHolidays,
      temporaryHolidays: holidays.map((h) => ({
        date: this.parseLocalDate(h.date),
        reason: h.reason,
      })),
      reservationSettings: {
        bookingWindowDays: data.reservationBookingWindowDays,
        bookingDeadlineHours: data.reservationBookingDeadlineHours,
        cancellationDeadlineHours: data.reservationCancellationDeadlineHours,
        slotDurationMinutes: data.reservationSlotDurationMinutes,
        bufferMinutes: data.reservationBufferMinutes,
        approvalMethod: data.reservationApprovalMethod as ApprovalMethodType,
      },
      status: data.status as TenantStatusType,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as TenantType;
  }

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

  async save(tenant: TenantType): Promise<void> {
    try {
      await this.executor
        .insert(tenants)
        .values({
          id: tenant.id,
          name: tenant.name,
          category: tenant.category,
          urlPath: tenant.urlPath,
          postalCode: tenant.postalCode,
          addressPrefecture: tenant.address.prefecture,
          addressCity: tenant.address.city,
          addressStreet: tenant.address.street,
          phoneNumber: tenant.phoneNumber,
          description: tenant.description,
          imageUrls: JSON.stringify(tenant.imageUrls),
          businessHours: JSON.stringify(tenant.businessHours),
          regularHolidays: JSON.stringify(tenant.regularHolidays),
          reservationBookingWindowDays:
            tenant.reservationSettings.bookingWindowDays,
          reservationBookingDeadlineHours:
            tenant.reservationSettings.bookingDeadlineHours,
          reservationCancellationDeadlineHours:
            tenant.reservationSettings.cancellationDeadlineHours,
          reservationSlotDurationMinutes:
            tenant.reservationSettings.slotDurationMinutes,
          reservationBufferMinutes: tenant.reservationSettings.bufferMinutes,
          reservationApprovalMethod: tenant.reservationSettings.approvalMethod,
          status: tenant.status,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        })
        .onConflictDoUpdate({
          target: tenants.id,
          set: {
            name: tenant.name,
            category: tenant.category,
            urlPath: tenant.urlPath,
            postalCode: tenant.postalCode,
            addressPrefecture: tenant.address.prefecture,
            addressCity: tenant.address.city,
            addressStreet: tenant.address.street,
            phoneNumber: tenant.phoneNumber,
            description: tenant.description,
            imageUrls: JSON.stringify(tenant.imageUrls),
            businessHours: JSON.stringify(tenant.businessHours),
            regularHolidays: JSON.stringify(tenant.regularHolidays),
            reservationBookingWindowDays:
              tenant.reservationSettings.bookingWindowDays,
            reservationBookingDeadlineHours:
              tenant.reservationSettings.bookingDeadlineHours,
            reservationCancellationDeadlineHours:
              tenant.reservationSettings.cancellationDeadlineHours,
            reservationSlotDurationMinutes:
              tenant.reservationSettings.slotDurationMinutes,
            reservationBufferMinutes: tenant.reservationSettings.bufferMinutes,
            reservationApprovalMethod:
              tenant.reservationSettings.approvalMethod,
            status: tenant.status,
            updatedAt: tenant.updatedAt,
          },
        });

      // Save temporary holidays: delete existing and re-insert
      await this.executor
        .delete(temporaryHolidays)
        .where(eq(temporaryHolidays.tenantId, tenant.id));

      if (tenant.temporaryHolidays.length > 0) {
        const holidayValues = tenant.temporaryHolidays.map((h) => ({
          id: uuidv7(),
          tenantId: tenant.id,
          date: this.formatDate(h.date),
          reason: h.reason,
        }));

        await this.executor.insert(temporaryHolidays).values(holidayValues);
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save tenant",
        error,
      );
    }
  }

  async findById(id: TenantIdType): Promise<TenantType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(tenants)
        .where(eq(tenants.id, id))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      const holidays = await this.executor
        .select()
        .from(temporaryHolidays)
        .where(eq(temporaryHolidays.tenantId, id));

      return this.into(rows[0], holidays);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tenant by id",
        error,
      );
    }
  }

  async findByUrlPath(urlPath: TenantUrlPathType): Promise<TenantType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(tenants)
        .where(eq(tenants.urlPath, urlPath))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      const holidays = await this.executor
        .select()
        .from(temporaryHolidays)
        .where(eq(temporaryHolidays.tenantId, rows[0].id));

      return this.into(rows[0], holidays);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tenant by url path",
        error,
      );
    }
  }

  async findAll(
    filter: TenantFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<TenantType>> {
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      const conditions = [];
      if (filter.keyword) {
        const pattern = `%${filter.keyword}%`;
        conditions.push(
          or(like(tenants.name, pattern), like(tenants.description, pattern)),
        );
      }
      if (filter.status) {
        conditions.push(eq(tenants.status, filter.status));
      }
      if (filter.category) {
        conditions.push(eq(tenants.category, filter.category));
      }
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(tenants)
          .where(whereClause)
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql<number>`count(*)` })
          .from(tenants)
          .where(whereClause),
      ]);

      // Fetch temporary holidays for all found tenants
      const tenantIds = items.map((item) => item.id);
      const allHolidays =
        tenantIds.length > 0
          ? await this.executor.select().from(temporaryHolidays)
          : [];

      const holidaysByTenantId = new Map<string, TemporaryHolidayDataModel[]>();
      for (const h of allHolidays) {
        if (tenantIds.includes(h.tenantId)) {
          const existing = holidaysByTenantId.get(h.tenantId) || [];
          existing.push(h);
          holidaysByTenantId.set(h.tenantId, existing);
        }
      }

      return {
        items: items.map((item) =>
          this.into(item, holidaysByTenantId.get(item.id) || []),
        ),
        total: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tenants",
        error,
      );
    }
  }

  async delete(id: TenantIdType): Promise<void> {
    try {
      // Delete reservations
      await this.executor
        .delete(reservations)
        .where(eq(reservations.tenantId, id));

      // Get staff profile IDs for this tenant
      const tenantStaffProfiles = await this.executor
        .select({ id: staffProfiles.id })
        .from(staffProfiles)
        .where(eq(staffProfiles.tenantId, id));
      const staffProfileIds = tenantStaffProfiles.map((sp) => sp.id);

      // Delete shift requests
      await this.executor
        .delete(shiftRequests)
        .where(eq(shiftRequests.tenantId, id));

      // Delete shifts
      await this.executor.delete(shifts).where(eq(shifts.tenantId, id));

      // Delete staff assigned menus
      for (const spId of staffProfileIds) {
        await this.executor
          .delete(staffAssignedMenus)
          .where(eq(staffAssignedMenus.staffProfileId, spId));
      }

      // Delete staff profiles
      await this.executor
        .delete(staffProfiles)
        .where(eq(staffProfiles.tenantId, id));

      // Delete menus
      await this.executor.delete(menus).where(eq(menus.tenantId, id));

      // Delete invitations
      await this.executor
        .delete(invitations)
        .where(eq(invitations.tenantId, id));

      // Delete members
      await this.executor.delete(members).where(eq(members.tenantId, id));

      // Delete temporary holidays
      await this.executor
        .delete(temporaryHolidays)
        .where(eq(temporaryHolidays.tenantId, id));

      // Delete tenant
      await this.executor.delete(tenants).where(eq(tenants.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete tenant",
        error,
      );
    }
  }

  async existsByUrlPath(urlPath: TenantUrlPathType): Promise<boolean> {
    try {
      const rows = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(tenants)
        .where(eq(tenants.urlPath, urlPath));

      return Number(rows[0].count) > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check if tenant exists by url path",
        error,
      );
    }
  }
}
