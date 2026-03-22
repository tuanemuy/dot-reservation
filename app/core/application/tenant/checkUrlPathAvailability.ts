import { TenantId, TenantUrlPath } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

export type CheckUrlPathAvailabilityInput = {
  urlPath: string;
  excludeTenantId: string | null;
};

export type CheckUrlPathAvailabilityOutput = {
  available: boolean;
};

export async function checkUrlPathAvailability({
  container,
  input,
}: ServiceArgs<CheckUrlPathAvailabilityInput>): Promise<CheckUrlPathAvailabilityOutput> {
  const urlPath = TenantUrlPath.create(input.urlPath);

  const available = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const existingTenant =
        await repositories.tenantRepository.findByUrlPath(urlPath);
      if (!existingTenant) {
        return true;
      }

      if (
        input.excludeTenantId &&
        existingTenant.id === TenantId.create(input.excludeTenantId)
      ) {
        return true;
      }

      return false;
    },
  );

  return { available };
}
