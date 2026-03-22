import { PhoneNumber } from "@/core/domain/common/valueObject";
import { Customer } from "@/core/domain/customer/entity";
import { CustomerId } from "@/core/domain/customer/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateCustomerProfileInput = {
  customerId: string;
  displayName: string;
  phoneNumber: string | null;
};

export type UpdateCustomerProfileOutput = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
};

export async function updateCustomerProfile({
  container,
  input,
}: ServiceArgs<UpdateCustomerProfileInput>): Promise<UpdateCustomerProfileOutput> {
  const customerId = CustomerId.create(input.customerId);
  const phoneNumber =
    input.phoneNumber !== null ? PhoneNumber.create(input.phoneNumber) : null;

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const existing =
        await repositories.customerRepository.findById(customerId);
      if (!existing) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Customer not found",
        );
      }

      const { entity: updated, events } = Customer.updateProfile(existing, {
        displayName: input.displayName,
        phoneNumber,
      });

      await repositories.customerRepository.save(updated);
      await repositories.outboxRepository.saveEvents(events);

      return updated;
    },
  );

  return {
    id: result.id,
    displayName: result.displayName,
    phoneNumber: result.phoneNumber,
  };
}
