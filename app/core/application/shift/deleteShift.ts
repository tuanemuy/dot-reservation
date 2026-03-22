import { ShiftId } from "@/core/domain/shift/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteShiftInput = {
  shiftId: string;
  deleteScope: "single" | "future";
};

export async function deleteShift({
  container,
  input,
}: ServiceArgs<DeleteShiftInput>): Promise<void> {
  const shiftId = ShiftId.create(input.shiftId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const shift = await repositories.shiftRepository.findById(shiftId);
    if (!shift) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Shift not found");
    }

    if (input.deleteScope === "single") {
      await repositories.shiftRepository.delete(shiftId);
    } else {
      // "future" scope
      if (shift.recurringGroupId) {
        await repositories.shiftRepository.deleteByRecurringGroupIdFromDate(
          shift.recurringGroupId,
          shift.date,
        );
      } else {
        await repositories.shiftRepository.delete(shiftId);
      }
    }
  });
}
