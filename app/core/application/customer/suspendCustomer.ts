import { Customer } from "@/core/domain/customer/entity";
import { CustomerId } from "@/core/domain/customer/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type SuspendCustomerInput = {
  customerId: string;
};

export async function suspendCustomer({
  container,
  input,
}: ServiceArgs<SuspendCustomerInput>): Promise<void> {
  const customerId = CustomerId.create(input.customerId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const customer = await repositories.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Customer not found");
    }

    if (!Customer.isActive(customer)) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Customer is already suspended",
      );
    }

    const { entity: suspended, events } = Customer.suspend(customer);

    await repositories.customerRepository.save(suspended);
    await repositories.outboxRepository.saveEvents(events);
  });
}
