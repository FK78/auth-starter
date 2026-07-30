import { pool } from "./db.ts";

export const resetTestDb = async (): Promise<void> => {
  await pool.query("TRUNCATE TABLE refresh_tokens, users");
};
