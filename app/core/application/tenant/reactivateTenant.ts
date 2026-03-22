import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type ReactivateTenantInput = {
  tenantId: string;
};

export async function reactivateTenant({
  container,
  input,
}: ServiceArgs<ReactivateTenantInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    if (!Tenant.isSuspended(tenant)) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Tenant is already active",
      );
    }

    const { entity: reactivatedTenant, events } = Tenant.reactivate(tenant);

    await repositories.tenantRepository.save(reactivatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
