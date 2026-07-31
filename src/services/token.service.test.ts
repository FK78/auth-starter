import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import type { PoolClient } from "pg";
import { issueTokenPair, rotateTokenPair } from "./token.service.ts";
import {
  saveRefreshToken,
  markTokenReplaced,
  linkReplacedToken,
} from "../queries/token.queries.ts";
import { hashToken } from "../utils/auth.ts";
import { env } from "../config/env.ts";
import type { RefreshToken } from "../types/tokens.ts";
import type { AuthUser } from "../types/auth.ts";

vi.mock("../queries/token.queries.ts");

const user: AuthUser = { id: "user-1" };

const fakeRefreshTokenRow = (overrides: Partial<RefreshToken> = {}): RefreshToken => ({
  id: "row-1",
  refreshTokenHash: "hash",
  userId: user.id,
  tokenFamilyId: "family-1",
  replacedById: null,
  revokedAt: null,
  revokedReason: null,
  expiresAt: new Date(),
  createdAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  vi.mocked(saveRefreshToken).mockResolvedValue(fakeRefreshTokenRow());
});

describe("issueTokenPair", () => {
  it("signs an access token with the correct claims", async () => {
    const { accessToken } = await issueTokenPair(user);

    const payload = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, {
      issuer: "auth-starter",
      audience: "auth-starter-api",
    }) as jwt.JwtPayload;

    expect(payload.sub).toBe(user.id);
    expect(payload.type).toBe("access");
  });

  it("persists the refresh token as a hash, not the raw value", async () => {
    const { refreshToken } = await issueTokenPair(user);

    const [savedInput] = vi.mocked(saveRefreshToken).mock.calls[0]!;

    expect(savedInput.refreshTokenHash).toBe(hashToken(refreshToken));
    expect(savedInput.refreshTokenHash).not.toBe(refreshToken);
    expect(savedInput.userId).toBe(user.id);
  });

  it("sets an expiry roughly 7 days in the future", async () => {
    await issueTokenPair(user);

    const [savedInput] = vi.mocked(saveRefreshToken).mock.calls[0]!;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(savedInput.expiresAt.getTime()).toBeGreaterThan(Date.now() + sevenDaysMs - 5000);
    expect(savedInput.expiresAt.getTime()).toBeLessThan(Date.now() + sevenDaysMs + 5000);
  });
});

describe("rotateTokenPair", () => {
  it("marks the old token replaced, persists a new one in the same family, and links them", async () => {
    const oldToken = fakeRefreshTokenRow({ id: "old-id", tokenFamilyId: "family-42" });
    const client = {} as PoolClient;
    vi.mocked(saveRefreshToken).mockResolvedValue(fakeRefreshTokenRow({ id: "new-id" }));

    await rotateTokenPair(user, oldToken, client);

    expect(markTokenReplaced).toHaveBeenCalledWith("old-id", client);
    expect(saveRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id, tokenFamilyId: "family-42" }),
      client,
    );
    expect(linkReplacedToken).toHaveBeenCalledWith("old-id", "new-id", client);
  });

  it("returns a fresh access/refresh token pair", async () => {
    const oldToken = fakeRefreshTokenRow({ id: "old-id" });

    const result = await rotateTokenPair(user, oldToken, {} as PoolClient);

    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
  });
});
