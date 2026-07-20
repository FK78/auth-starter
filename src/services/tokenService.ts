import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import {
  markTokenReplaced,
  saveRefreshToken,
  type RefreshToken,
} from "../queries/tokenQueries.ts";
import type { AuthUser } from "../types/auth.ts";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = (user: AuthUser): string =>
  jwt.sign({ sub: user.id, type: "access" }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m", issuer: "tudo", audience: "tudo-api"
  });

const signRefreshToken = (user: AuthUser, jti: string) => {
  const refreshToken = jwt.sign(
    { sub: user.id, jti, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d", issuer: "tudo", audience: "tudo-api" },
  );
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  return { refreshToken, tokenHash };
};

const createAndPersistTokenPair = async (
  user: AuthUser,
  tokenFamilyId: string,
) => {
  const jti = randomUUID();
  const accessToken = signAccessToken(user);
  const { refreshToken, tokenHash } = signRefreshToken(user, jti);

  const newRow = await saveRefreshToken({
    jti,
    tokenHash,
    userId: user.id,
    tokenFamilyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken, newRow };
};

export const issueTokenPair = async (user: AuthUser) => {
  const { accessToken, refreshToken } = await createAndPersistTokenPair(
    user,
    randomUUID(),
  );
  return { accessToken, refreshToken };
};

export const rotateTokenPair = async (
  user: AuthUser,
  oldToken: RefreshToken,
) => {
  const { accessToken, refreshToken, newRow } = await createAndPersistTokenPair(
    user,
    oldToken.tokenFamilyId,
  );
  await markTokenReplaced(oldToken.id, newRow.id);
  return { accessToken, refreshToken };
};
