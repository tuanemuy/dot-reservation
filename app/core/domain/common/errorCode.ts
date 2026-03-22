const CommonErrorCode = {
  InvalidEmail: "INVALID_EMAIL",
  InvalidPhoneNumber: "INVALID_PHONE_NUMBER",
  InvalidPostalCode: "INVALID_POSTAL_CODE",
  InvalidAddress: "INVALID_ADDRESS",
  InvalidTimeOfDay: "INVALID_TIME_OF_DAY",
  InvalidDayOfWeek: "INVALID_DAY_OF_WEEK",
} as const;

type CommonErrorCode = (typeof CommonErrorCode)[keyof typeof CommonErrorCode];

export { CommonErrorCode };
