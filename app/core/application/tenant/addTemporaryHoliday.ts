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
  const date = new Date(input.date);

  if (Number.isNaN(date.getTime())) {
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
