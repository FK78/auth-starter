import { pool } from "../db/db.ts";

export const createUser = (
  name: string,
  email: string,
  hashedPassword: string,
) => {
  return pool.query(
    "INSERT INTO users(name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
    [name, email, hashedPassword],
  );
};

export const findByEmail = (email: string) => {
  return pool.query("SELECT email FROM users WHERE email = $1", [email]);
};

export const getUser = (email: string) => {
  return pool.query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [email],
  );
};

export const saveUserRefreshToken = (
  token: string,
  userId: string,
) => {
  return pool.query(
    "INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
    [userId, token],
  );
};

// user_id UUID NOT NULL REFERENCES users(id),
// token TEXT NOT NULL,
// expires_at TIMESTAMP NOT NULL,
// created_at TIMESTAMP DEFAULT NOW()
