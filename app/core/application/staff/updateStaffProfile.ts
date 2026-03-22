import { StaffProfile } from "@/core/domain/staff/entity";
import { StaffProfileId } from "@/core/domain/staff/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateStaffProfileInput = {
  staffProfileId: string;
  displayName: string;
  imageUrl: string | null;
  bio: string | null;
};

export type UpdateStaffProfileOutput = {
  id: string;
  displayName: string;
};

export async function updateStaffProfile({
  container,
  input,
}: ServiceArgs<UpdateStaffProfileInput>): Promise<UpdateStaffProfileOutput> {
  const staffProfileId = StaffProfileId.create(input.staffProfileId);

  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      const staffProfile =
        await repositories.staffProfileRepository.findById(staffProfileId);
      if (!staffProfile) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          "Staff profile not found",
        );
      }

      const updatedProfile = StaffProfile.updateProfile(staffProfile, {
        displayName: input.displayName,
        imageUrl: input.imageUrl,
        bio: input.bio,
      });

      await repositories.staffProfileRepository.save(updatedProfile);

      return updatedProfile;
    },
  );

  return {
    id: result.id,
    displayName: result.displayName,
  };
}
