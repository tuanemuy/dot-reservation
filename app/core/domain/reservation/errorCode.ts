const ReservationErrorCode = {
  InvalidStatus: "RESERVATION_INVALID_STATUS",
  CannotCancel: "RESERVATION_CANNOT_CANCEL",
  CannotModify: "RESERVATION_CANNOT_MODIFY",
  CannotApprove: "RESERVATION_CANNOT_APPROVE",
  CannotReject: "RESERVATION_CANNOT_REJECT",
  SlotNotAvailable: "RESERVATION_SLOT_NOT_AVAILABLE",
  BookingWindowExceeded: "RESERVATION_BOOKING_WINDOW_EXCEEDED",
  BookingDeadlinePassed: "RESERVATION_BOOKING_DEADLINE_PASSED",
  InvalidTimeSlot: "RESERVATION_INVALID_TIME_SLOT",
} as const;

type ReservationErrorCode =
  (typeof ReservationErrorCode)[keyof typeof ReservationErrorCode];

export { ReservationErrorCode };
