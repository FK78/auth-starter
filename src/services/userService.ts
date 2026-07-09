import { randomBytes, timingSafeEqual } from "crypto";
import { AppError } from "../errors/AppError.ts";
import { createUser, findByEmail, getUser } from "../queries/userQueries.ts";
import { hashPassword, issueJwt } from "../utils/auth.ts";

export type User = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async ({ name, email, password }: User) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await checkIfUserExistsAlready(normalizedEmail);
  if (userExists) {
    throw new AppError("User already exists", 400);
  }
  const hashedPassword: string = await hashPassword(password);
  const result = await createUser(name, normalizedEmail, hashedPassword);
  if (result.rowCount === 1) {
    const user = result.rows[0];
    const token = issueJwt({ id: user.id, email: normalizedEmail });
    return token;
  } else {
    throw new AppError("Failed to create user", 500);
  }
};

export const loginUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await checkIfUserExistsAlreadyAndGetData(
    normalizedEmail,
    name,
  );

  console.log(userExists)

  const hashedWithExtractedSalt = userExists
    ? Buffer.from(userExists.password_hash.split("$")[4], "base64")
    : randomBytes(16);

  const newHash: string = await hashPassword(password, hashedWithExtractedSalt);

  if (!userExists || !compareHash(userExists.password_hash, newHash)) {
    throw new AppError("Invalid credentials", 400);
  }
  const accessToken = issueJwt({ id: userExists.id, email: normalizedEmail }, "ACCESS_TOKEN");
  const refreshToken = issueJwt({ id: userExists.id, email: normalizedEmail }, "REFRESH_TOKEN");
  return {accessToken, refreshToken};
};

export const compareHash = (storedHash: string, generatedHash: string) => {
  const stored = Buffer.from(storedHash);
  const generated = Buffer.from(generatedHash);
  return (
    stored.length === generated.length && timingSafeEqual(stored, generated)
  );
};

const checkIfUserExistsAlreadyAndGetData = async (
  email: string,
  name: string,
) => {
  const result = await getUser(email, name);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
};

const checkIfUserExistsAlready = async (email: string) => {
  const result = await findByEmail(email);
  return result.rows.length > 0;
};
