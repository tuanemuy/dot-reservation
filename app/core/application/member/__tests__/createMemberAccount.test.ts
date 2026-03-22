import { describe, expect, it } from "vitest";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMemberAccount } from "../createMemberAccount";

describe("createMemberAccount", () => {
  const getContainer = setupTestContainer();

  it("should create account with valid authUserId, name, and email", async () => {
    const container = getContainer();
    const result = await createMemberAccount({
      container,
      headers: createMockHeaders(),
      input: {
        authUserId: "auth-user-1",
        name: "Test User",
        email: "test@example.com",
      },
    });

    expect(result.authUserId).toBe("auth-user-1");
    expect(result.name).toBe("Test User");
    expect(result.email).toBe("test@example.com");
  });

  it("should return output DTO with correct authUserId, name, and email", async () => {
    const container = getContainer();
    const result = await createMemberAccount({
      container,
      headers: createMockHeaders(),
      input: {
        authUserId: "auth-user-2",
        name: "Another User",
        email: "another@example.com",
      },
    });

    expect(result).toEqual({
      authUserId: "auth-user-2",
      name: "Another User",
      email: "another@example.com",
    });
  });

  it("should throw ValidationError when authUserId is empty", async () => {
    const container = getContainer();
    await expect(
      createMemberAccount({
        container,
        headers: createMockHeaders(),
        input: {
          authUserId: "",
          name: "Test User",
          email: "test@example.com",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    await expect(
      createMemberAccount({
        container,
        headers: createMockHeaders(),
        input: {
          authUserId: "auth-user-1",
          name: "",
          email: "test@example.com",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when email has invalid format", async () => {
    const container = getContainer();
    await expect(
      createMemberAccount({
        container,
        headers: createMockHeaders(),
        input: {
          authUserId: "auth-user-1",
          name: "Test User",
          email: "not-an-email",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when email is empty", async () => {
    const container = getContainer();
    await expect(
      createMemberAccount({
        container,
        headers: createMockHeaders(),
        input: {
          authUserId: "auth-user-1",
          name: "Test User",
          email: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
