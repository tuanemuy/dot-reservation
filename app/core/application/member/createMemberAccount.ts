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
  input,
}: ServiceArgs<CreateMemberAccountInput>): Promise<CreateMemberAccountOutput> {
  return {
    authUserId: input.authUserId,
    name: input.name,
    email: input.email,
  };
}
