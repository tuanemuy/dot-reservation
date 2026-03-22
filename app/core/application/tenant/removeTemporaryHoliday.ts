import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type RemoveTemporaryHolidayInput = {
  tenantId: string;
  date: string;
};

export async function removeTemporaryHoliday({
  container,
  input,
}: ServiceArgs<RemoveTemporaryHolidayInput>): Promise<void> {
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

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    const { entity: updatedTenant, events } = Tenant.removeTemporaryHoliday(
      tenant,
      date,
    );

    await repositories.tenantRepository.save(updatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
