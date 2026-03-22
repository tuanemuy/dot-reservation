import type { InferSelectModel } from "drizzle-orm";
import { and, eq, gte, lte } from "drizzle-orm";
import { shifts } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { TimeOfDay as TimeOfDayType } from "@/core/domain/common/valueObject";
import type { Shift as ShiftType } from "@/core/domain/shift/entity";
import type { ShiftRepository } from "@/core/domain/shift/ports/shiftRepository";
import type {
  RecurringGroupId as RecurringGroupIdType,
  ShiftId as ShiftIdType,
  TimeRange as TimeRangeType,
} from "@/core/domain/shift/valueObject";
import type { StaffProfileId as StaffProfileIdType } from "@/core/domain/staff/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type ShiftDataModel = InferSelectModel<typeof shifts>;

export class DrizzleSqliteShiftRepository implements ShiftRepository {
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

  private into(data: ShiftDataModel): ShiftType {
    return {
      id: data.id as ShiftIdType,
      tenantId: data.tenantId as TenantIdType,
      staffProfileId: data.staffProfileId as StaffProfileIdType,
      date: this.parseLocalDate(data.date),
      timeRange: {
        start: data.startTime as TimeOfDayType,
        end: data.endTime as TimeOfDayType,
      } as TimeRangeType,
      recurringGroupId: (data.recurringGroupId as RecurringGroupIdType) || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(shift: ShiftType): Promise<void> {
    try {
      await this.executor
        .insert(shifts)
        .values({
          id: shift.id,
          tenantId: shift.tenantId,
          staffProfileId: shift.staffProfileId,
          date: this.formatDate(shift.date),
          startTime: shift.timeRange.start,
          endTime: shift.timeRange.end,
          recurringGroupId: shift.recurringGroupId,
          createdAt: shift.createdAt,
          updatedAt: shift.updatedAt,
        })
        .onConflictDoUpdate({
          target: shifts.id,
          set: {
            tenantId: shift.tenantId,
            staffProfileId: shift.staffProfileId,
            date: this.formatDate(shift.date),
            startTime: shift.timeRange.start,
            endTime: shift.timeRange.end,
            recurringGroupId: shift.recurringGroupId,
            updatedAt: shift.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save shift",
        error,
      );
    }
  }

  async findById(id: ShiftIdType): Promise<ShiftType | null> {
    try {
      const rows = await this.executor
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .limit(1);

      return rows.length > 0 ? this.into(rows[0]) : null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shift by id",
        error,
      );
    }
  }

  async findByTenantIdAndDateRange(
    tenantId: TenantIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.tenantId, tenantId),
            gte(shifts.date, this.formatDate(startDate)),
            lte(shifts.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shifts by tenant id and date range",
        error,
      );
    }
  }

  async findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.staffProfileId, staffProfileId),
            gte(shifts.date, this.formatDate(startDate)),
            lte(shifts.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shifts by staff profile id and date range",
        error,
      );
    }
  }

  async findByRecurringGroupId(
    groupId: RecurringGroupIdType,
  ): Promise<ShiftType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(shifts)
        .where(eq(shifts.recurringGroupId, groupId));

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shifts by recurring group id",
        error,
      );
    }
  }

  async delete(id: ShiftIdType): Promise<void> {
    try {
      await this.executor.delete(shifts).where(eq(shifts.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete shift",
        error,
      );
    }
  }

  async deleteByRecurringGroupIdFromDate(
    groupId: RecurringGroupIdType,
    fromDate: Date,
  ): Promise<void> {
    try {
      await this.executor
        .delete(shifts)
        .where(
          and(
            eq(shifts.recurringGroupId, groupId),
            gte(shifts.date, this.formatDate(fromDate)),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete shifts by recurring group id from date",
        error,
      );
    }
  }
}
