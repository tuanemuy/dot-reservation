import { Tenant } from "@/core/domain/tenant/entity";
import {
  ReservationSettings,
  TenantId,
} from "@/core/domain/tenant/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type UpdateReservationSettingsInput = {
  tenantId: string;
  bookingWindowDays: number;
  bookingDeadlineHours: number;
  cancellationDeadlineHours: number;
  slotDurationMinutes: number;
  bufferMinutes: number;
  approvalMethod: string;
};

export async function updateReservationSettings({
  container,
  input,
}: ServiceArgs<UpdateReservationSettingsInput>): Promise<void> {
  const tenantId = TenantId.create(input.tenantId);
  const settings = ReservationSettings.create({
    bookingWindowDays: input.bookingWindowDays,
    bookingDeadlineHours: input.bookingDeadlineHours,
    cancellationDeadlineHours: input.cancellationDeadlineHours,
    slotDurationMinutes: input.slotDurationMinutes,
    bufferMinutes: input.bufferMinutes,
    approvalMethod: input.approvalMethod,
  });

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const tenant = await repositories.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
    }

    const { entity: updatedTenant, events } = Tenant.updateReservationSettings(
      tenant,
      settings,
    );

    await repositories.tenantRepository.save(updatedTenant);
    await repositories.outboxRepository.saveEvents(events);
  });
}
