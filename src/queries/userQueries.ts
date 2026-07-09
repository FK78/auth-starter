import { pool } from "../db/db.ts";

export const createUser = (
  name: string,
  email: string,
  hashedPassword: string,
) => {
  return pool.query(
    "INSERT INTO users(name, email, password_hash) VALUES ($1, $2, $3)",
    [name, email, hashedPassword],
  );
};

export const findByEmail = (email: string) => {
  return pool.query("SELECT email FROM users WHERE email = $1", [email]);
};
