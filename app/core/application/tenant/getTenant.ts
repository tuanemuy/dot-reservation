import type {
  DailyHours,
  TemporaryHoliday,
} from "@/core/domain/tenant/valueObject";
import { TenantId, TenantUrlPath } from "@/core/domain/tenant/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type GetTenantInput = {
  tenantId?: string;
  urlPath?: string;
};

export type GetTenantOutput = {
  id: string;
  name: string;
  category: string;
  urlPath: string;
  postalCode: string;
  address: { prefecture: string; city: string; street: string };
  phoneNumber: string;
  description: string | null;
  imageUrls: string[];
  businessHours: Record<number, { open: string; close: string } | null>;
  regularHolidays: number[];
  temporaryHolidays: { date: string; reason: string | null }[];
  reservationSettings: {
    bookingWindowDays: number;
    bookingDeadlineHours: number;
    cancellationDeadlineHours: number;
    slotDurationMinutes: number;
    bufferMinutes: number;
    approvalMethod: string;
  };
  status: string;
};

export async function getTenant({
  container,
  input,
}: ServiceArgs<GetTenantInput>): Promise<GetTenantOutput> {
  if (!input.tenantId && !input.urlPath) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Either tenantId or urlPath must be provided",
    );
  }

  const tenant = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      if (input.tenantId) {
        const tenantId = TenantId.create(input.tenantId);
        return repositories.tenantRepository.findById(tenantId);
      }
      const urlPath = TenantUrlPath.create(input.urlPath as string);
      return repositories.tenantRepository.findByUrlPath(urlPath);
    },
  );

  if (!tenant) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
  }

  const businessHoursOutput: Record<
    number,
    { open: string; close: string } | null
  > = {};
  for (const key of [0, 1, 2, 3, 4, 5, 6] as const) {
    const hours: DailyHours = tenant.businessHours[key];
    businessHoursOutput[key] = hours
      ? { open: hours.open, close: hours.close }
      : null;
  }

  return {
    id: tenant.id,
    name: tenant.name,
    category: tenant.category,
    urlPath: tenant.urlPath,
    postalCode: tenant.postalCode,
    address: {
      prefecture: tenant.address.prefecture,
      city: tenant.address.city,
      street: tenant.address.street,
    },
    phoneNumber: tenant.phoneNumber,
    description: tenant.description,
    imageUrls: [...tenant.imageUrls],
    businessHours: businessHoursOutput,
    regularHolidays: [...tenant.regularHolidays],
    temporaryHolidays: tenant.temporaryHolidays.map((h: TemporaryHoliday) => ({
      date: h.date.toISOString(),
      reason: h.reason,
    })),
    reservationSettings: {
      bookingWindowDays: tenant.reservationSettings.bookingWindowDays,
      bookingDeadlineHours: tenant.reservationSettings.bookingDeadlineHours,
      cancellationDeadlineHours:
        tenant.reservationSettings.cancellationDeadlineHours,
      slotDurationMinutes: tenant.reservationSettings.slotDurationMinutes,
      bufferMinutes: tenant.reservationSettings.bufferMinutes,
      approvalMethod: tenant.reservationSettings.approvalMethod,
    },
    status: tenant.status,
  };
}
