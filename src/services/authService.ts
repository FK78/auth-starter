import { randomBytes } from "crypto";
import { AppError } from "../errors/AppError.ts";
import {
  createUser,
  findByEmail,
  getUser,
  saveUserRefreshToken,
} from "../queries/authQueries.ts";
import { compareHash, hashPassword, issueJwt } from "../utils/auth.ts";

export type User = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async ({ name, email, password }: User) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findByEmail(normalizedEmail);
  if (existing.rows.length > 0) {
    throw new AppError("User already exists", 400);
  }
  const hashedPassword: string = await hashPassword(password);
  const result = await createUser(name, normalizedEmail, hashedPassword);

  if (result.rowCount === 1) {
    const user = result.rows[0];
    return await issueTokenPair(user);
  } else {
    throw new AppError("Failed to create user", 500);
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
  const result = await getUser(normalizedEmail);
  const user = result.rows[0];

  const hashedWithExtractedSalt = user
    ? Buffer.from(user.password_hash.split("$")[4], "base64")
    : randomBytes(16);

  const newHash: string = await hashPassword(password, hashedWithExtractedSalt);

  if (!user || !compareHash(user.password_hash, newHash)) {
    throw new AppError("Invalid credentials", 400);
  }
  return await issueTokenPair(user);
};

const issueTokenPair = async (user: { id: string; email: string }) => {
  const accessToken = issueJwt(user, "ACCESS_TOKEN");
  const refreshToken = issueJwt(user, "REFRESH_TOKEN");
  const saveResult = await saveUserRefreshToken(refreshToken, user.id);
  if (saveResult.rowCount === 1) {
    return { accessToken, refreshToken };
  } else {
    throw new AppError("Failed to save token", 500);
  }
};
