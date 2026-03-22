import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { Email } from "@/core/domain/common/valueObject";
import type { Customer } from "@/core/domain/customer/entity";
import type { CustomerId } from "@/core/domain/customer/valueObject";

export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(id: CustomerId): Promise<Customer | null>;
  findByAuthUserId(authUserId: string): Promise<Customer | null>;
  findByEmail(email: Email): Promise<Customer | null>;
  findAll(
    filter: CustomerFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Customer>>;
  delete(id: CustomerId): Promise<void>;
}

export type CustomerFilter = {
  readonly status?: "active" | "suspended";
};
