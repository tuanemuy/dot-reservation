import { TenantEvents } from "@/core/domain/tenant/events";
import { TenantId } from "@/core/domain/tenant/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteTenantInput = {
  tenantId: string;
};

export async function deleteTenant({
  container,
  input,
}: ServiceArgs<DeleteTenantInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    await repositories.tenantRepository.delete(tenantId);
    await repositories.outboxRepository.saveEvents([
      TenantEvents.deleted(tenantId),
    ]);
  });
}
