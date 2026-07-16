import { randomBytes } from "crypto";
import { AppError } from "../errors/AppError.ts";
import { createUser, findByEmail, getUser } from "../queries/authQueries.ts";
import { compareHash, hashString } from "../utils/auth.ts";
import { issueTokenPair } from "./tokenService.ts";

export type User = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async ({ name, email, password }: User) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findByEmail(normalizedEmail);

  if (existing.rows.length > 0) {
    throw new AppError("User already exists", 409);
  }
  const hashedPassword: string = await hashString(password);

  try {
    const result = await createUser(name, normalizedEmail, hashedPassword);
    const user = result.rows[0];
    return await issueTokenPair(user);
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
  const result = await getUser(normalizedEmail);
  const user = result.rows[0];

  const hashedWithExtractedSalt = user
    ? Buffer.from(user.password_hash.split("$")[4], "base64")
    : randomBytes(16);

  const newHash: string = await hashString(password, hashedWithExtractedSalt);

  if (!user || !compareHash(user.password_hash, newHash)) {
    throw new AppError("Invalid credentials", 401);
  }
  return await issueTokenPair(user);
};
