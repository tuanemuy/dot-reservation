import type {
  Pagination,
  PaginationResult,
} from "@/core/domain/common/pagination";
import type { Member } from "@/core/domain/member/entity";
import type { MemberId } from "@/core/domain/member/valueObject";
import type { TenantId } from "@/core/domain/tenant/valueObject";

export interface MemberRepository {
  save(member: Member): Promise<void>;
  findById(id: MemberId): Promise<Member | null>;
  findByTenantId(
    tenantId: TenantId,
    pagination: Pagination,
  ): Promise<PaginationResult<Member>>;
  findByAuthUserId(authUserId: string): Promise<Member[]>;
  findByTenantIdAndAuthUserId(
    tenantId: TenantId,
    authUserId: string,
  ): Promise<Member | null>;
  countAdminsByTenantId(tenantId: TenantId): Promise<number>;
  delete(id: MemberId): Promise<void>;
}
