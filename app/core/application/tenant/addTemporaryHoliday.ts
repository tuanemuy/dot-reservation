import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type AddTemporaryHolidayInput = {
  tenantId: string;
  date: string;
  reason: string | null;
};

export async function addTemporaryHoliday({
  container,
  input,
}: ServiceArgs<AddTemporaryHolidayInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);

  // Parse date string as local date (YYYY-MM-DD)
  const dateParts = input.date.split("-").map(Number);
  const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  if (
    Number.isNaN(date.getTime()) ||
    dateParts.length !== 3 ||
    date.getFullYear() !== dateParts[0] ||
    date.getMonth() !== dateParts[1] - 1 ||
    date.getDate() !== dateParts[2]
  ) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Invalid date format",
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Cannot add a temporary holiday in the past",
    );
  }

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    const { entity: updatedTenant, events } = Tenant.addTemporaryHoliday(
      tenant,
      { date, reason: input.reason },
    );

    await repositories.tenantRepository.save(updatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
