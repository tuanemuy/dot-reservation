import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { MemberErrorCode } from "./errorCode";

const MEMBER_NAME_MAX_LENGTH = 50;

// MemberId
type MemberId = string & { readonly brand: "MemberId" };

const MemberId = {
  create: (id: string): MemberId => {
    return id as MemberId;
  },
  generate: (): MemberId => {
    return uuidv7() as MemberId;
  },
};

export { MemberId };

// MemberName
type MemberName = string & { readonly brand: "MemberName" };

const MemberName = {
  create: (value: string): MemberName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        MemberErrorCode.NameEmpty,
        "Member name cannot be empty",
      );
    }
    if (value.length > MEMBER_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        MemberErrorCode.NameTooLong,
        `Member name must be ${MEMBER_NAME_MAX_LENGTH} characters or less`,
      );
    }
    return value as MemberName;
  },
  maxLength: MEMBER_NAME_MAX_LENGTH,
};

export { MemberName };

// MemberRole
type MemberRole = "admin" | "staff";

const MemberRole = {
  create: (value: string): MemberRole => {
    if (value !== "admin" && value !== "staff") {
      throw new BusinessRuleError(
        MemberErrorCode.InvalidRole,
        "Invalid member role",
      );
    }
    return value as MemberRole;
  },
  isAdmin: (role: MemberRole): role is "admin" => role === "admin",
  isStaff: (role: MemberRole): role is "staff" => role === "staff",
};

export { MemberRole };

// InvitationId
type InvitationId = string & { readonly brand: "InvitationId" };

const InvitationId = {
  create: (id: string): InvitationId => {
    return id as InvitationId;
  },
  generate: (): InvitationId => {
    return uuidv7() as InvitationId;
  },
};

export { InvitationId };

// InvitationStatus
type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

const InvitationStatus = {
  create: (value: string): InvitationStatus => {
    if (
      value !== "pending" &&
      value !== "accepted" &&
      value !== "declined" &&
      value !== "expired" &&
      value !== "cancelled"
    ) {
      throw new BusinessRuleError(
        MemberErrorCode.InvalidInvitationStatus,
        "Invalid invitation status",
      );
    }
    return value as InvitationStatus;
  },
  isPending: (status: InvitationStatus): status is "pending" =>
    status === "pending",
  isAccepted: (status: InvitationStatus): status is "accepted" =>
    status === "accepted",
  isDeclined: (status: InvitationStatus): status is "declined" =>
    status === "declined",
  isExpired: (status: InvitationStatus): status is "expired" =>
    status === "expired",
  isCancelled: (status: InvitationStatus): status is "cancelled" =>
    status === "cancelled",
};

export { InvitationStatus };
