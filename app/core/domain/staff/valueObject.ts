import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { StaffErrorCode } from "./errorCode";

const STAFF_DISPLAY_NAME_MAX_LENGTH = 50;
const STAFF_BIO_MAX_LENGTH = 1000;

// StaffProfileId
type StaffProfileId = string & { readonly brand: "StaffProfileId" };

export type { StaffProfileId };

export const StaffProfileId = {
  create: (id: string): StaffProfileId => {
    return id as StaffProfileId;
  },
  generate: (): StaffProfileId => {
    return uuidv7() as StaffProfileId;
  },
};

// StaffDisplayName
type StaffDisplayName = string & { readonly brand: "StaffDisplayName" };

export type { StaffDisplayName };

export const StaffDisplayName = {
  create: (value: string): StaffDisplayName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        StaffErrorCode.DisplayNameEmpty,
        "Display name cannot be empty",
      );
    }
    if (value.length > STAFF_DISPLAY_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        StaffErrorCode.DisplayNameTooLong,
        `Display name must be ${STAFF_DISPLAY_NAME_MAX_LENGTH} characters or less`,
      );
    }
    return value as StaffDisplayName;
  },
  maxLength: STAFF_DISPLAY_NAME_MAX_LENGTH,
};

// StaffBio
type StaffBio = string & { readonly brand: "StaffBio" };

export type { StaffBio };

export const StaffBio = {
  create: (value: string): StaffBio => {
    if (value.length > STAFF_BIO_MAX_LENGTH) {
      throw new BusinessRuleError(
        StaffErrorCode.BioTooLong,
        `Bio must be ${STAFF_BIO_MAX_LENGTH} characters or less`,
      );
    }
    return value as StaffBio;
  },
  maxLength: STAFF_BIO_MAX_LENGTH,
};
