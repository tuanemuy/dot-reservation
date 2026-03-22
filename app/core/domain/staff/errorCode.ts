const StaffErrorCode = {
  DisplayNameEmpty: "STAFF_DISPLAY_NAME_EMPTY",
  DisplayNameTooLong: "STAFF_DISPLAY_NAME_TOO_LONG",
  BioTooLong: "STAFF_BIO_TOO_LONG",
} as const;

type StaffErrorCode = (typeof StaffErrorCode)[keyof typeof StaffErrorCode];

export { StaffErrorCode };
