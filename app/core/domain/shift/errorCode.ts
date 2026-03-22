export const ShiftErrorCode = {
  InvalidTimeRange: "SHIFT_INVALID_TIME_RANGE",
  InvalidShiftRequestType: "SHIFT_INVALID_REQUEST_TYPE",
  Conflict: "SHIFT_CONFLICT",
} as const;

export type ShiftErrorCode =
  (typeof ShiftErrorCode)[keyof typeof ShiftErrorCode];
