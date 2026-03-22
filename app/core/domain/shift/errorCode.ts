const ShiftErrorCode = {
  InvalidTimeRange: "SHIFT_INVALID_TIME_RANGE",
  InvalidShiftRequestType: "SHIFT_INVALID_REQUEST_TYPE",
  Conflict: "SHIFT_CONFLICT",
} as const;

type ShiftErrorCode = (typeof ShiftErrorCode)[keyof typeof ShiftErrorCode];

export { ShiftErrorCode };
