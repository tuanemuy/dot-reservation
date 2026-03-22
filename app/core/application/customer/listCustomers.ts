import type { CustomerFilter } from "@/core/domain/customer/ports/customerRepository";
import { CustomerStatus } from "@/core/domain/customer/valueObject";
import type { ServiceArgs } from "../types";

export type ListCustomersInput = {
  keyword: string | null;
  status: string | null;
  page: number;
  limit: number;
};

export type CustomerSummary = {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  status: string;
  createdAt: Date;
};

export type ListCustomersOutput = {
  items: CustomerSummary[];
  totalCount: number;
};

export async function listCustomers({
  container,
  input,
}: ServiceArgs<ListCustomersInput>): Promise<ListCustomersOutput> {
  const filter: CustomerFilter = {
    keyword: input.keyword ?? undefined,
    status: input.status ? CustomerStatus.create(input.status) : undefined,
  };

  const result = await container.customerRepository.findAll(filter, {
    page: input.page,
    limit: input.limit,
  });

  return {
    items: result.items.map((customer) => ({
      id: customer.id,
      displayName: customer.displayName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      status: customer.status,
      createdAt: customer.createdAt,
    })),
    totalCount: result.total,
  };
}
