import { Email } from "@/core/domain/common/valueObject";
import { Customer } from "@/core/domain/customer/entity";
import { ConflictError, ConflictErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type CreateCustomerInput = {
  authUserId: string;
  displayName: string;
  email: string;
};

export type CreateCustomerOutput = {
  id: string;
  displayName: string;
  email: string;
};

export async function createCustomer({
  container,
  input,
}: ServiceArgs<CreateCustomerInput>): Promise<CreateCustomerOutput> {
  const email = Email.create(input.email);

  // Check for duplicate authUserId
  const existing = await container.customerRepository.findByAuthUserId(
    input.authUserId,
  );
  if (existing) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Customer with this authUserId already exists",
    );
  }

  const { entity: customer, events } = Customer.create({
    authUserId: input.authUserId,
    displayName: input.displayName,
    email,
    phoneNumber: null,
  });

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    await repositories.customerRepository.save(customer);
    await repositories.outboxRepository.saveEvents(events);
  });

  return {
    id: customer.id,
    displayName: customer.displayName,
    email: customer.email,
  };
}
