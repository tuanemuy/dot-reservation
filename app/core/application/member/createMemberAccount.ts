import { Email } from "@/core/domain/common/valueObject";
import { MemberName } from "@/core/domain/member/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type CreateMemberAccountInput = {
  authUserId: string;
  name: string;
  email: string;
};

export type CreateMemberAccountOutput = {
  authUserId: string;
  name: string;
  email: string;
};

/**
 * Creates a member account (base account).
 *
 * This use case does not persist a Member entity. The actual Member entity
 * (with tenantId) is created when accepting an invitation via acceptInvitation.
 * This simply validates and returns the provided auth user information.
 */
export async function createMemberAccount({
  container,
  input,
}: ServiceArgs<CreateMemberAccountInput>): Promise<CreateMemberAccountOutput> {
  if (!input.authUserId) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "authUserId is required",
    );
  }

  // Validate name via MemberName value object (throws BusinessRuleError on empty/too long)
  MemberName.create(input.name);

  // Validate email via Email value object (throws BusinessRuleError on invalid format)
  Email.create(input.email);

  // Check for duplicate authUserId
  const existingMembers = await container.memberRepository.findByAuthUserId(
    input.authUserId,
  );
  if (existingMembers.length > 0) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Member account with this authUserId already exists",
    );
  }

  return {
    authUserId: input.authUserId,
    name: input.name,
    email: input.email,
  };
}
