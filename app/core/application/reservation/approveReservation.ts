import { Reservation } from "@/core/domain/reservation/entity";
import { ReservationId } from "@/core/domain/reservation/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type ApproveReservationInput = {
  reservationId: string;
};

export async function approveReservation({
  container,
  input,
}: ServiceArgs<ApproveReservationInput>): Promise<void> {
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
        "Only pending reservations can be approved",
      );
    }

    const { entity: approved, events } = Reservation.approve(reservation);

    await repositories.reservationRepository.save(approved);
    await repositories.outboxRepository.saveEvents(events);
  });
}
