import {
  Address,
  PhoneNumber,
  PostalCode,
} from "@/core/domain/common/valueObject";
import { Tenant } from "@/core/domain/tenant/entity";
import { TenantId, TenantUrlPath } from "@/core/domain/tenant/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type UpdateTenantProfileInput = {
  tenantId: string;
  name: string;
  category: string;
  urlPath: string;
  postalCode: string;
  address: { prefecture: string; city: string; street: string };
  phoneNumber: string;
  description: string | null;
  imageUrls: string[];
};

export type UpdateTenantProfileOutput = {
  id: string;
  name: string;
  urlPath: string;
};

export async function updateTenantProfile({
  container,
  input,
}: ServiceArgs<UpdateTenantProfileInput>): Promise<UpdateTenantProfileOutput> {
  const tenantId = TenantId.create(input.tenantId);
  const postalCode = PostalCode.create(input.postalCode);
  const address = Address.create(input.address);
  const phoneNumber = PhoneNumber.create(input.phoneNumber);
  const newUrlPath = TenantUrlPath.create(input.urlPath);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const tenant = await repositories.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      if (tenant.urlPath !== newUrlPath) {
        const urlPathExists =
          await repositories.tenantRepository.existsByUrlPath(newUrlPath);
        if (urlPathExists) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            "URL path is already in use",
          );
        }
      }

      const { entity: updatedTenant, events } = Tenant.updateProfile(tenant, {
        name: input.name,
        category: input.category,
        urlPath: newUrlPath,
        postalCode,
        address,
        phoneNumber,
        description: input.description,
        imageUrls: input.imageUrls,
      });

      await repositories.tenantRepository.save(updatedTenant);
      await repositories.outboxRepository.saveEvents(events);

      return updatedTenant;
    },
  );

  return {
    id: result.id,
    name: result.name,
    urlPath: result.urlPath,
  };
}
