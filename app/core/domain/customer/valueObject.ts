import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { CustomerErrorCode } from "./errorCode";

const CUSTOMER_DISPLAY_NAME_MAX_LENGTH = 50;

// CustomerId
type CustomerId = string & { readonly brand: "CustomerId" };

const CustomerId = {
  create: (id: string): CustomerId => {
    return id as CustomerId;
  },
  generate: (): CustomerId => {
    return uuidv7() as CustomerId;
  },
};

export { CustomerId };

// CustomerDisplayName
type CustomerDisplayName = string & {
  readonly brand: "CustomerDisplayName";
};

const CustomerDisplayName = {
  create: (value: string): CustomerDisplayName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        CustomerErrorCode.DisplayNameEmpty,
        "Display name cannot be empty",
      );
    }
    if (value.length > CUSTOMER_DISPLAY_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        CustomerErrorCode.DisplayNameTooLong,
        `Display name must be ${CUSTOMER_DISPLAY_NAME_MAX_LENGTH} characters or less`,
      );
    }
    return value as CustomerDisplayName;
  },
  maxLength: CUSTOMER_DISPLAY_NAME_MAX_LENGTH,
};

export { CustomerDisplayName };

// CustomerStatus
type CustomerStatus = "active" | "suspended";

const CustomerStatus = {
  create: (status: string): CustomerStatus => {
    if (status !== "active" && status !== "suspended") {
      throw new BusinessRuleError(
        CustomerErrorCode.InvalidStatus,
        "Invalid customer status",
      );
    }
    return status as CustomerStatus;
  },
  isActive: (status: CustomerStatus): status is "active" => status === "active",
  isSuspended: (status: CustomerStatus): status is "suspended" =>
    status === "suspended",
};

export { CustomerStatus };
