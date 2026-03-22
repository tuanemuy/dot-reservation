import { DayOfWeek } from "@/core/domain/common/valueObject";
import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateRegularHolidaysInput = {
  tenantId: string;
  dayOfWeeks: number[];
};

export async function updateRegularHolidays({
  container,
  input,
}: ServiceArgs<UpdateRegularHolidaysInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const dayOfWeeks = input.dayOfWeeks.map((d) => DayOfWeek.create(d));

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    const { entity: updatedTenant, events } = Tenant.updateRegularHolidays(
      tenant,
      dayOfWeeks,
    );

    await repositories.tenantRepository.save(updatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
