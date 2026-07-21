import { randomBytes } from "crypto";
import { AppError } from "../errors/AppError.ts";
import {
  createUser,
  emailExists,
  findUserByEmail,
  findUserById,
} from "../queries/authQueries.ts";
import { compareHash, hashString } from "../utils/auth.ts";
import { issueTokenPair, rotateTokenPair } from "./tokenService.ts";
import jwt from "jsonwebtoken";
import {
  findRefreshTokenByJti,
  revokeTokenFamily,
} from "../queries/tokenQueries.ts";
import { withTransaction } from "../db/db.ts";

export type User = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async ({ name, email, password }: User) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (await emailExists(normalizedEmail)) {
    throw new AppError("User already exists", 409);
  }
  const hashedPassword: string = await hashString(password);

  try {
    const result = await createUser(name, normalizedEmail, hashedPassword);
    return await issueTokenPair(result);
  } catch (err: any) {
    if (err.code === "23505") {
      throw new AppError("User already exists", 409);
    }
    throw err;
  }
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await findUserByEmail(normalizedEmail);
  const extractedSalt = result?.passwordHash.split("$")[4];

  const hashedWithExtractedSalt = extractedSalt
    ? Buffer.from(extractedSalt, "base64")
    : randomBytes(16);

  const newHash: string = await hashString(password, hashedWithExtractedSalt);

  if (!result || !compareHash(result.passwordHash, newHash)) {
    throw new AppError("Invalid credentials", 401);
  }
  return await issueTokenPair(result);
};

export const refreshTokens = async (incomingRefreshToken: string) => {
  return await withTransaction(async (client) => {
    let payload: { sub: string; jti: string };
    try {
      payload = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
        { algorithms: ["HS256"], issuer: "tudo", audience: "tudo-api" }
      ) as typeof payload;
    } catch {
      throw new AppError("Invalid refresh token", 401);
    }

    const tokenRow = await findRefreshTokenByJti(payload.jti, client);
    if (!tokenRow) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (tokenRow.revokedAt || tokenRow.replacedById) {
      await revokeTokenFamily(tokenRow.tokenFamilyId, "reuse_detected", client);
      throw new AppError("Refresh token reuse detected", 401);
    }

    if (tokenRow.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401);
    }

    const user = await findUserById(tokenRow.userId, client);
    if (!user) {
      throw new AppError("User not found", 401);
    }

    return await rotateTokenPair(user, tokenRow, client);
  })
};

export const verifyToken = async (incomingAccessToken: string) => {
  let payload: { sub: string; expiresAt: Date };
  try {
    payload = jwt.verify(
      incomingAccessToken,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as typeof payload;
  } catch {
    throw new AppError("Invalid access token", 401);
  }

  if (payload.expiresAt < new Date()) {
    throw new AppError("Access token expired", 401);
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new AppError("User not found", 401);
  }

  return true;
};
