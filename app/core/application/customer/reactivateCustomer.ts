import type { SuspendedCustomer } from "@/core/domain/customer/entity";
import { Customer } from "@/core/domain/customer/entity";
import { CustomerId } from "@/core/domain/customer/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type ReactivateCustomerInput = {
  customerId: string;
};

export async function reactivateCustomer({
  container,
  input,
}: ServiceArgs<ReactivateCustomerInput>): Promise<void> {
  const customerId = CustomerId.create(input.customerId);

  const customer = await container.customerRepository.findById(customerId);
  if (!customer) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Customer not found");
  }

  if (Customer.isActive(customer)) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Customer is already active",
    );
  }

  const { entity: reactivated, events } = Customer.reactivate(
    customer as SuspendedCustomer,
  );

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    await repositories.customerRepository.save(reactivated);
    await repositories.outboxRepository.saveEvents(events);
  });
}
