import type { InferSelectModel } from "drizzle-orm";
import { and, eq, gte, lte } from "drizzle-orm";
import { shiftRequests } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { TimeOfDay as TimeOfDayType } from "@/core/domain/common/valueObject";
import type { ShiftRequest as ShiftRequestType } from "@/core/domain/shift/entity";
import type { ShiftRequestRepository } from "@/core/domain/shift/ports/shiftRequestRepository";
import type {
  ShiftRequestId as ShiftRequestIdType,
  ShiftRequestType as ShiftRequestTypeType,
  TimeRange as TimeRangeType,
} from "@/core/domain/shift/valueObject";
import type { StaffProfileId as StaffProfileIdType } from "@/core/domain/staff/valueObject";
import type { TenantId as TenantIdType } from "@/core/domain/tenant/valueObject";
import type { Executor } from "../client";

type ShiftRequestDataModel = InferSelectModel<typeof shiftRequests>;

export class DrizzleSqliteShiftRequestRepository
  implements ShiftRequestRepository
{
  constructor(private readonly executor: Executor) {}

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private into(data: ShiftRequestDataModel): ShiftRequestType {
    const timeRange: TimeRangeType | null =
      data.startTime && data.endTime
        ? ({
            start: data.startTime as TimeOfDayType,
            end: data.endTime as TimeOfDayType,
          } as TimeRangeType)
        : null;

    return {
      id: data.id as ShiftRequestIdType,
      tenantId: data.tenantId as TenantIdType,
      staffProfileId: data.staffProfileId as StaffProfileIdType,
      date: new Date(data.date),
      type: data.type as ShiftRequestTypeType,
      timeRange,
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(request: ShiftRequestType): Promise<void> {
    try {
      await this.executor
        .insert(shiftRequests)
        .values({
          id: request.id,
          tenantId: request.tenantId,
          staffProfileId: request.staffProfileId,
          date: this.formatDate(request.date),
          type: request.type,
          startTime: request.timeRange?.start ?? null,
          endTime: request.timeRange?.end ?? null,
          note: request.note,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        })
        .onConflictDoUpdate({
          target: shiftRequests.id,
          set: {
            tenantId: request.tenantId,
            staffProfileId: request.staffProfileId,
            date: this.formatDate(request.date),
            type: request.type,
            startTime: request.timeRange?.start ?? null,
            endTime: request.timeRange?.end ?? null,
            note: request.note,
            updatedAt: request.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save shift request",
        error,
      );
    }
  }

  async findByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftRequestType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(shiftRequests)
        .where(
          and(
            eq(shiftRequests.staffProfileId, staffProfileId),
            gte(shiftRequests.date, this.formatDate(startDate)),
            lte(shiftRequests.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shift requests by staff profile id and date range",
        error,
      );
    }
  }

  async findByTenantIdAndDateRange(
    tenantId: TenantIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftRequestType[]> {
    try {
      const rows = await this.executor
        .select()
        .from(shiftRequests)
        .where(
          and(
            eq(shiftRequests.tenantId, tenantId),
            gte(shiftRequests.date, this.formatDate(startDate)),
            lte(shiftRequests.date, this.formatDate(endDate)),
          ),
        );

      return rows.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find shift requests by tenant id and date range",
        error,
      );
    }
  }

  async deleteByStaffProfileIdAndDateRange(
    staffProfileId: StaffProfileIdType,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    try {
      await this.executor
        .delete(shiftRequests)
        .where(
          and(
            eq(shiftRequests.staffProfileId, staffProfileId),
            gte(shiftRequests.date, this.formatDate(startDate)),
            lte(shiftRequests.date, this.formatDate(endDate)),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete shift requests by staff profile id and date range",
        error,
      );
    }
  }
}
