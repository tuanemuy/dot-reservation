import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { Tenant } from "@/core/domain/tenant/entity";
import type {
  TenantCategory,
  TenantId,
  TenantStatus,
  TenantUrlPath,
} from "@/core/domain/tenant/valueObject";

export type TenantFilter = {
  readonly keyword?: string;
  readonly status?: TenantStatus;
  readonly category?: TenantCategory;
};

export interface TenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: TenantId): Promise<Tenant | null>;
  findByUrlPath(urlPath: TenantUrlPath): Promise<Tenant | null>;
  findAll(
    filter: TenantFilter,
    pagination: Pagination,
  ): Promise<PaginationResult<Tenant>>;
  delete(id: TenantId): Promise<void>;
  existsByUrlPath(urlPath: TenantUrlPath): Promise<boolean>;
}
