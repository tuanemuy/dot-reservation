import type { StaffProfileRepository } from "@/core/domain/staff/ports/staffProfileRepository";
import { TenantId } from "@/core/domain/tenant/valueObject";

export type ListStaffProfilesInput = {
  tenantId: string;
};

export type StaffProfileSummary = {
  id: string;
  displayName: string;
  imageUrl: string | null;
};

export type ListStaffProfilesOutput = {
  items: StaffProfileSummary[];
};

type ListStaffProfilesArgs = {
  container: {
    staffProfileRepository: StaffProfileRepository;
  };
  headers: Headers;
  input: ListStaffProfilesInput;
};

export async function listStaffProfiles({
  container,
  input,
}: ListStaffProfilesArgs): Promise<ListStaffProfilesOutput> {
  const tenantId = TenantId.create(input.tenantId);

  const staffProfiles =
    await container.staffProfileRepository.findByTenantId(tenantId);

  return {
    items: staffProfiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      imageUrl: profile.imageUrl,
    })),
  };
}
