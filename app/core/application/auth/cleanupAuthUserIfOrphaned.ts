import type { ServiceArgs } from "../types";

export type CleanupAuthUserIfOrphanedInput = {
  authUserId: string;
};

export async function cleanupAuthUserIfOrphaned({
  container,
  input,
}: ServiceArgs<CleanupAuthUserIfOrphanedInput>): Promise<void> {
  const { authUserId } = input;

  const [customer, members] = await Promise.all([
    container.customerRepository.findByAuthUserId(authUserId),
    container.memberRepository.findByAuthUserId(authUserId),
  ]);

  if (customer !== null || members.length > 0) {
    return;
  }

  try {
    await container.authProvider.deleteUser(authUserId);
  } catch (error) {
    console.error(`Failed to delete orphaned auth user: ${authUserId}`, error);
  }
}
