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
  const date = new Date(input.date);

  if (Number.isNaN(date.getTime())) {
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
