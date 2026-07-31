import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema.ts";

describe("registerSchema", () => {
  it("accepts a valid payload and trims the name", () => {
    const result = registerSchema.safeParse({
      name: "  Ada Lovelace  ",
      email: "ada@example.com",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Ada Lovelace");
  });

  it("rejects an empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "ada@example.com",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password exactly one character below the minimum (7 chars)", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "1234567",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a password exactly at the minimum (8 chars)", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "12345678",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a name that is only whitespace, after trimming", () => {
    const result = registerSchema.safeParse({
      name: "   ",
      email: "ada@example.com",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "anything",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });

    expect(result.success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("accepts a non-empty refresh token", () => {
    const result = refreshSchema.safeParse({ refreshToken: "abc123" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty refresh token", () => {
    const result = refreshSchema.safeParse({ refreshToken: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a missing refresh token", () => {
    const result = refreshSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a refresh token that is a number, not a string", () => {
    const result = refreshSchema.safeParse({ refreshToken: 12345 });

    expect(result.success).toBe(false);
  });

  it("rejects a refresh token that is an array", () => {
    const result = refreshSchema.safeParse({ refreshToken: ["abc123"] });

    expect(result.success).toBe(false);
  });

  it("rejects a refresh token that is null", () => {
    const result = refreshSchema.safeParse({ refreshToken: null });

    expect(result.success).toBe(false);
  });
});
