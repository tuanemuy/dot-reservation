import { TimeOfDay } from "@/core/domain/common/valueObject";
import { Tenant } from "@/core/domain/tenant/entity";
import {
  BusinessHours,
  type DailyHours,
  TenantId,
} from "@/core/domain/tenant/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type UpdateBusinessHoursInput = {
  tenantId: string;
  businessHours: Record<number, { open: string; close: string } | null>;
};

export async function updateBusinessHours({
  container,
  input,
}: ServiceArgs<UpdateBusinessHoursInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);

  const parsedHours: Record<number, DailyHours> = {};
  for (const key of [0, 1, 2, 3, 4, 5, 6] as const) {
    const entry = input.businessHours[key];
    if (entry === null || entry === undefined) {
      parsedHours[key] = null;
    } else {
      const open = TimeOfDay.create(entry.open);
      const close = TimeOfDay.create(entry.close);
      if (TimeOfDay.compare(open, close) >= 0) {
        throw new ValidationError(
          ValidationErrorCode.InvalidInput,
          `Open time must be before close time for day ${key}`,
        );
      }
      parsedHours[key] = { open, close };
    }
  }

  const businessHours = BusinessHours.create(parsedHours);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    const { entity: updatedTenant, events } = Tenant.updateBusinessHours(
      tenant,
      businessHours,
    );

    await repositories.tenantRepository.save(updatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
