import { Reservation } from "@/core/domain/reservation/entity";
import { ReservationId } from "@/core/domain/reservation/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type RejectReservationInput = {
  reservationId: string;
  reason: string | null;
};

export async function rejectReservation({
  container,
  input,
}: ServiceArgs<RejectReservationInput>): Promise<void> {
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

    if (reservation.status !== "pending") {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Only pending reservations can be rejected",
      );
    }

    const { entity: rejected, events } = Reservation.reject(
      reservation,
      input.reason,
    );

    await repositories.reservationRepository.save(rejected);
    await repositories.outboxRepository.saveEvents(events);
  });
}
