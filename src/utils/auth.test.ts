import { describe, it, expect } from "vitest";
import {
  hashString,
  compareHash,
  generateOpaqueToken,
  hashToken,
} from "./auth.ts";

describe("hashString", () => {
  it("returns an argon2id-formatted hash string", async () => {
    const hash = await hashString("correct-horse-battery");

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$.+\$.+$/);
  });

  it("produces the same hash for the same password and salt", async () => {
    const salt = Buffer.from("0123456789abcdef");

    const first = await hashString("correct-horse-battery", salt);
    const second = await hashString("correct-horse-battery", salt);

    expect(first).toBe(second);
  });

  it("produces a different hash for a different salt", async () => {
    const first = await hashString("correct-horse-battery", Buffer.from("0123456789abcdef"));
    const second = await hashString("correct-horse-battery", Buffer.from("fedcba9876543210"));

    expect(first).not.toBe(second);
  });
});

describe("compareHash", () => {
  it("returns true for identical hashes", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const hash = await hashString("correct-horse-battery", salt);

    expect(compareHash(hash, hash)).toBe(true);
  });

  it("returns false for different hashes", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const hashA = await hashString("correct-horse-battery", salt);
    const hashB = await hashString("wrong-password", salt);

    expect(compareHash(hashA, hashB)).toBe(false);
  });

  it("returns false without throwing when lengths differ", () => {
    expect(compareHash("short", "a-much-longer-string-here")).toBe(false);
  });
});

describe("generateOpaqueToken", () => {
  it("returns a base64url string with no padding characters", () => {
    const token = generateOpaqueToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates a different token on each call", () => {
    const first = generateOpaqueToken();
    const second = generateOpaqueToken();

    expect(first).not.toBe(second);
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("my-refresh-token")).toBe(hashToken("my-refresh-token"));
  });

  it("produces a 128-character hex string (SHA-512)", () => {
    expect(hashToken("my-refresh-token")).toMatch(/^[a-f0-9]{128}$/);
  });

  it("produces different output for different input", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});
