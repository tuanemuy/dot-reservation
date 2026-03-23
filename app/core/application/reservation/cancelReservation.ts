import { Reservation } from "@/core/domain/reservation/entity";
import { ReservationId } from "@/core/domain/reservation/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type CancelReservationInput = {
  reservationId: string;
  reason: string | null;
  cancelledBy: "customer" | "admin" | "staff";
};

export async function cancelReservation({
  container,
  input,
}: ServiceArgs<CancelReservationInput>): Promise<void> {
  const reservationId = ReservationId.create(input.reservationId);

  await container.unitOfWorkProvider.transaction(async (repositories) => {
    const reservation =
      await repositories.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Reservation not found",
      );
    }

    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "pending"
    ) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Only confirmed or pending reservations can be cancelled",
      );
    }

    // Customer cancellation: check deadline
    if (input.cancelledBy === "customer") {
      const tenant = await repositories.tenantRepository.findById(
        reservation.tenantId,
      );
      if (!tenant) {
        throw new NotFoundError(NotFoundErrorCode.NotFound, "Tenant not found");
      }

      const now = new Date();
      const canCancel = Reservation.canCancel(
        reservation,
        tenant.reservationSettings,
        now,
      );

      if (!canCancel) {
        throw new ForbiddenError(
          ForbiddenErrorCode.InsufficientPermissions,
          "Cancellation deadline has passed",
        );
      }
    }

    const { entity: cancelled, events } = Reservation.cancel(
      reservation,
      input.reason,
      input.cancelledBy,
    );

    await repositories.reservationRepository.save(cancelled);
    await repositories.outboxRepository.saveEvents(events);
  });
}
