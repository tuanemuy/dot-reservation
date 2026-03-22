export const MemberErrorCode = {
  NameEmpty: "MEMBER_NAME_EMPTY",
  NameTooLong: "MEMBER_NAME_TOO_LONG",
  InvalidRole: "MEMBER_INVALID_ROLE",
  InvalidInvitationStatus: "MEMBER_INVALID_INVITATION_STATUS",
  InvitationNotPending: "MEMBER_INVITATION_NOT_PENDING",
  InvitationExpired: "MEMBER_INVITATION_EXPIRED",
  LastAdminCannotBeRemoved: "MEMBER_LAST_ADMIN_CANNOT_BE_REMOVED",
  LastAdminCannotChangeRole: "MEMBER_LAST_ADMIN_CANNOT_CHANGE_ROLE",
  LastAdminCannotDeleteAccount: "MEMBER_LAST_ADMIN_CANNOT_DELETE_ACCOUNT",
} as const;

export type MemberErrorCode =
  (typeof MemberErrorCode)[keyof typeof MemberErrorCode];
