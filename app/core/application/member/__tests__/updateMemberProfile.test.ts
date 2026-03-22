import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { updateMemberProfile } from "../updateMemberProfile";
import { addMemberToTenant, createTestTenant } from "./memberTestHelpers";

describe("updateMemberProfile", () => {
  const getContainer = setupTestContainer();

  it("should update name and return updated profile", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const result = await updateMemberProfile({
      container,
      headers: createMockHeaders(),
      input: {
        memberId: adminMemberId,
        name: "Updated Name",
        phoneNumber: null,
      },
    });

    expect(result.id).toBe(adminMemberId);
    expect(result.name).toBe("Updated Name");
    expect(result.phoneNumber).toBeNull();
  });

  it("should update both name and phoneNumber", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    const result = await updateMemberProfile({
      container,
      headers: createMockHeaders(),
      input: {
        memberId: adminMemberId,
        name: "Updated Name",
        phoneNumber: "090-1234-5678",
      },
    });

    expect(result.name).toBe("Updated Name");
    expect(result.phoneNumber).toBe("090-1234-5678");
  });

  it("should clear phoneNumber when set to null", async () => {
    const container = getContainer();
    const { tenantId, adminMemberId } = await createTestTenant(container);

    // First set a phone number
    await updateMemberProfile({
      container,
      headers: createMockHeaders(),
      input: {
        memberId: adminMemberId,
        name: "Admin User",
        phoneNumber: "090-1234-5678",
      },
    });

    // Then clear it
    const result = await updateMemberProfile({
      container,
      headers: createMockHeaders(),
      input: {
        memberId: adminMemberId,
        name: "Admin User",
        phoneNumber: null,
      },
    });

    expect(result.phoneNumber).toBeNull();
  });

  it("should throw NotFoundError for non-existent memberId", async () => {
    const container = getContainer();

    await expect(
      updateMemberProfile({
        container,
        headers: createMockHeaders(),
        input: {
          memberId: "non-existent-id",
          name: "Test",
          phoneNumber: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const { adminMemberId } = await createTestTenant(container);

    await expect(
      updateMemberProfile({
        container,
        headers: createMockHeaders(),
        input: {
          memberId: adminMemberId,
          name: "",
          phoneNumber: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when phoneNumber has invalid format", async () => {
    const container = getContainer();
    const { adminMemberId } = await createTestTenant(container);

    await expect(
      updateMemberProfile({
        container,
        headers: createMockHeaders(),
        input: {
          memberId: adminMemberId,
          name: "Test User",
          phoneNumber: "invalid-phone",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
