import { AppError } from "../errors/AppError.ts";
import { createUser, findByEmail } from "../queries/userQueries.ts";
import { hashPassword } from "../utils/auth.ts";

type User = {
  name: string;
  email: string;
  password: string;
};

export const registerUser = async ({ name, email, password }: User) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await checkIfUserExistsAlready(normalizedEmail);
  if (userExists) {
    throw new AppError("User already exists", 400)
  }
  const hashedPassword: string = await hashPassword(password);
  const user = await createUser(name, normalizedEmail, hashedPassword);
  return user;
};

const checkIfUserExistsAlready = async (email: string) => {
  const result = await findByEmail(email);
  return result.rows.length > 0;
};
