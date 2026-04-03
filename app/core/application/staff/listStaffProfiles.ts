import { TenantId } from "@/core/domain/tenant/valueObject";
import type { ServiceArgs } from "../types";

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

export async function listStaffProfiles({
  container,
  input,
}: ServiceArgs<ListStaffProfilesInput>): Promise<ListStaffProfilesOutput> {
  const tenantId = TenantId.create(input.tenantId);

  const staffProfiles =
    await container.staffProfileRepository.findByTenantId(tenantId);

  return {
    items: staffProfiles.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      imageUrl: profile.imageUrl
        ? container.storageManager.resolveImageUrl(profile.imageUrl)
        : null,
    })),
  };
}
