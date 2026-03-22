import type { DomainEvent } from "@/core/domain/common/event";
import { Reservation } from "@/core/domain/reservation/entity";
import type { ServiceArgs } from "../types";

export type CompleteReservationsInput = {
  now: Date;
};

export type CompleteReservationsOutput = {
  completedCount: number;
};

export async function completeReservations({
  container,
  input,
}: ServiceArgs<CompleteReservationsInput>): Promise<CompleteReservationsOutput> {
  const result = await container.unitOfWorkProvider.transaction(
    async (repositories) => {
      // Find confirmed reservations whose end time has passed
      const completableReservations =
        await repositories.reservationRepository.findConfirmedEndedBefore(
          input.now,
        );

      const allEvents: DomainEvent[] = [];
      let completedCount = 0;

      for (const reservation of completableReservations) {
        const { entity: completed, events } = Reservation.complete(reservation);
        await repositories.reservationRepository.save(completed);
        allEvents.push(...events);
        completedCount++;
      }

      if (allEvents.length > 0) {
        await repositories.outboxRepository.saveEvents(allEvents);
      }

      return { completedCount };
    },
  );

  return result;
}
