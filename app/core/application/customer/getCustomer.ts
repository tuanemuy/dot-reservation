import { CustomerId } from "@/core/domain/customer/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type GetCustomerInput = {
  customerId?: string;
  authUserId?: string;
};

export type GetCustomerOutput = {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  status: string;
  createdAt: Date;
};

export async function getCustomer({
  container,
  input,
}: ServiceArgs<GetCustomerInput>): Promise<GetCustomerOutput> {
  if (!input.customerId && !input.authUserId) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Either customerId or authUserId must be provided",
    );
  }

  // After the validation above, we know at least one of these is defined
  const customer = input.customerId
    ? await container.customerRepository.findById(
        CustomerId.create(input.customerId),
      )
    : // biome-ignore lint/style/noNonNullAssertion: validated above
      await container.customerRepository.findByAuthUserId(input.authUserId!);

  if (!customer) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Customer not found");
  }

  return {
    id: customer.id,
    displayName: customer.displayName,
    email: customer.email,
    phoneNumber: customer.phoneNumber,
    status: customer.status,
    createdAt: customer.createdAt,
  };
}
