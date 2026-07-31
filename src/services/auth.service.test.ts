import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser, loginUser, refreshTokens } from "./auth.service.ts";
import {
  createUser,
  emailExists,
  findUserByEmail,
  findUserById,
} from "../queries/auth.queries.ts";
import {
  findRefreshTokenByHash,
  revokeTokenFamily,
} from "../queries/token.queries.ts";
import { issueTokenPair, rotateTokenPair } from "./token.service.ts";
import { hashString } from "../utils/auth.ts";
import { AppError } from "../errors/AppError.ts";
import type { UserRecord } from "../types/auth.ts";
import type { RefreshToken } from "../types/tokens.ts";
import type { PoolClient } from "pg";

vi.mock("../queries/auth.queries.ts");
vi.mock("../queries/token.queries.ts");
vi.mock("./token.service.ts");
vi.mock("../db/db.ts", () => ({
  withTransaction: vi.fn((fn: (client: PoolClient) => unknown) => fn({} as PoolClient)),
}));

const fakeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  passwordHash: "hash",
  ...overrides,
});

const fakeTokens = { accessToken: "access-token", refreshToken: "refresh-token" };

beforeEach(() => {
  vi.mocked(issueTokenPair).mockResolvedValue(fakeTokens);
  vi.mocked(rotateTokenPair).mockResolvedValue(fakeTokens);
});

describe("registerUser", () => {
  it("creates a user and issues a token pair when the email is free", async () => {
    vi.mocked(emailExists).mockResolvedValue(false);
    const createdUser = fakeUser();
    vi.mocked(createUser).mockResolvedValue(createdUser);

    const result = await registerUser({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "correct-horse-battery",
    });

    expect(emailExists).toHaveBeenCalledWith("ada@example.com");
    expect(createUser).toHaveBeenCalledWith(
      "Ada Lovelace",
      "ada@example.com",
      expect.stringContaining("$argon2id$"),
    );
    expect(issueTokenPair).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual(fakeTokens);
  });

  it("throws 409 without creating a user when the email already exists", async () => {
    vi.mocked(emailExists).mockResolvedValue(true);

    await expect(
      registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse-battery" }),
    ).rejects.toMatchObject(new AppError("User already exists", 409));

    expect(createUser).not.toHaveBeenCalled();
  });

  it("maps a unique-violation error from createUser to a 409", async () => {
    vi.mocked(emailExists).mockResolvedValue(false);
    vi.mocked(createUser).mockRejectedValue({ code: "23505" });

    await expect(
      registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse-battery" }),
    ).rejects.toMatchObject(new AppError("User already exists", 409));
  });

  it("rethrows any other createUser error unchanged", async () => {
    vi.mocked(emailExists).mockResolvedValue(false);
    const dbError = new Error("connection lost");
    vi.mocked(createUser).mockRejectedValue(dbError);

    await expect(
      registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse-battery" }),
    ).rejects.toBe(dbError);
  });
});

describe("loginUser", () => {
  it("issues a token pair for correct credentials", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const passwordHash = await hashString("correct-horse-battery", salt);
    const user = fakeUser({ passwordHash });
    vi.mocked(findUserByEmail).mockResolvedValue(user);

    const result = await loginUser({ email: "ada@example.com", password: "correct-horse-battery" });

    expect(issueTokenPair).toHaveBeenCalledWith(user);
    expect(result).toEqual(fakeTokens);
  });

  it("throws 401 for a wrong password", async () => {
    const salt = Buffer.from("0123456789abcdef");
    const passwordHash = await hashString("correct-horse-battery", salt);
    vi.mocked(findUserByEmail).mockResolvedValue(fakeUser({ passwordHash }));

    await expect(
      loginUser({ email: "ada@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject(new AppError("Invalid credentials", 401));

    expect(issueTokenPair).not.toHaveBeenCalled();
  });

  it("throws the same 401 for an unknown email (no user enumeration)", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await expect(
      loginUser({ email: "nobody@example.com", password: "anything" }),
    ).rejects.toMatchObject(new AppError("Invalid credentials", 401));

    expect(issueTokenPair).not.toHaveBeenCalled();
  });
});

describe("refreshTokens", () => {
  const fakeRow = (overrides: Partial<RefreshToken> = {}): RefreshToken => ({
    id: "token-1",
    refreshTokenHash: "hash",
    userId: "user-1",
    tokenFamilyId: "family-1",
    replacedById: null,
    revokedAt: null,
    revokedReason: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    createdAt: new Date(),
    ...overrides,
  });

  it("rotates the token pair for a valid refresh token", async () => {
    const row = fakeRow();
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(row);
    vi.mocked(findUserById).mockResolvedValue(fakeUser());

    const result = await refreshTokens("some-refresh-token");

    expect(rotateTokenPair).toHaveBeenCalledWith(fakeUser(), row, {});
    expect(result).toEqual(fakeTokens);
  });

  it("throws 401 when the token isn't found", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(null);

    await expect(refreshTokens("unknown")).rejects.toMatchObject(
      new AppError("Invalid refresh token", 401),
    );
  });

  it("revokes the token family and throws on reuse of a replaced token", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(
      fakeRow({ replacedById: "newer-token-id" }),
    );

    await expect(refreshTokens("stale-token")).rejects.toMatchObject(
      new AppError("Refresh token reuse detected", 401),
    );

    expect(revokeTokenFamily).toHaveBeenCalledWith("family-1", "reuse_detected");
  });

  it("revokes the token family and throws on reuse of a revoked token", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(
      fakeRow({ revokedAt: new Date() }),
    );

    await expect(refreshTokens("revoked-token")).rejects.toMatchObject(
      new AppError("Refresh token reuse detected", 401),
    );

    expect(revokeTokenFamily).toHaveBeenCalledWith("family-1", "reuse_detected");
  });

  it("throws 401 when the token has expired", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(
      fakeRow({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(refreshTokens("expired-token")).rejects.toMatchObject(
      new AppError("Refresh token expired", 401),
    );
  });

  it("throws 401 when the user no longer exists", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(fakeRow());
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(refreshTokens("some-refresh-token")).rejects.toMatchObject(
      new AppError("User not found", 401),
    );
  });
});
