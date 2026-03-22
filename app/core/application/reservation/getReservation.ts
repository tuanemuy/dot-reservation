import { ReservationId } from "@/core/domain/reservation/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type GetReservationInput = {
  reservationId: string;
};

export type GetReservationOutput = {
  id: string;
  tenantId: string;
  customerId: string | null;
  menuName: string;
  menuDuration: number;
  menuPrice: number;
  staffName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhoneNumber: string | null;
  note: string | null;
  cancellationReason: string | null;
  rejectionReason: string | null;
  createdBy: string;
  createdAt: Date;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getReservation({
  container,
  input,
}: ServiceArgs<GetReservationInput>): Promise<GetReservationOutput> {
  const reservationId = ReservationId.create(input.reservationId);

  const reservation =
    await container.reservationRepository.findById(reservationId);
  if (!reservation) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      "Reservation not found",
    );
  }

  return {
    id: reservation.id,
    tenantId: reservation.tenantId,
    customerId: reservation.customerId,
    menuName: reservation.menuName,
    menuDuration: reservation.menuDuration,
    menuPrice: reservation.menuPrice,
    staffName: reservation.staffName,
    date: formatDate(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    customerPhoneNumber: reservation.customerPhoneNumber,
    note: reservation.note,
    cancellationReason: reservation.cancellationReason,
    rejectionReason: reservation.rejectionReason,
    createdBy: reservation.createdBy,
    createdAt: reservation.createdAt,
  };
}
