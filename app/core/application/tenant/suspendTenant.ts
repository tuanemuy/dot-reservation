import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type SuspendTenantInput = {
  tenantId: string;
};

export async function suspendTenant({
  container,
  input,
}: ServiceArgs<SuspendTenantInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    if (!Tenant.isActive(tenant)) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Tenant is already suspended",
      );
    }

    const { entity: suspendedTenant, events } = Tenant.suspend(tenant);

    await repositories.tenantRepository.save(suspendedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
