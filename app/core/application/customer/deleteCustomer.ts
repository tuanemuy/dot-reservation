import { CustomerEvents } from "@/core/domain/customer/events";
import { CustomerId } from "@/core/domain/customer/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteCustomerInput = {
  customerId: string;
};

export async function deleteCustomer({
  container,
  input,
}: ServiceArgs<DeleteCustomerInput>): Promise<void> {
  const customerId = CustomerId.create(input.customerId);

  const customer = await container.customerRepository.findById(customerId);
  if (!customer) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Customer not found");
  }

  // Check for future confirmed reservations
  const futureReservationCount =
    await container.reservationRepository.countByCustomerIdAndStatusAndDateAfter(
      customerId,
      "confirmed",
      new Date(),
    );

  if (futureReservationCount > 0) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Cannot delete customer with future confirmed reservations",
    );
  }

  const events = [CustomerEvents.deleted(customer.id, customer.email)];

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    await repositories.customerRepository.delete(customerId);
    await repositories.outboxRepository.saveEvents(events);
  });
}
