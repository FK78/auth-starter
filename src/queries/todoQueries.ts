import { pool } from "../db/db.ts";

export interface TodoResponse {
  id: string;
  title: string;
  description: string;
}

interface TodoRow {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: Date;
}

const mapRow = (row: TodoRow): TodoResponse => ({
  id: row.id,
  title: row.title,
  description: row.description,
});

export const saveTodo = async (
  title: string,
  description: string,
  userId: string,
) => {
  const result = await pool.query(
    "INSERT INTO todos(title, description, user_id) VALUES ($1, $2, $3) RETURNING id, title, description",
    [title, description, userId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert todo row");
  }
  return mapRow(row)
};
