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
    throw new Error("Failed to insert todo");
  }
  return mapRow(row)
};

export const update = async (
  title: string,
  description: string,
  userId: string,
  todoId: string
) => {
  const result = await pool.query(
    "UPDATE todos SET title = $1, description = $2 WHERE user_id = $3 AND id = $4 RETURNING id, title, description",
    [title, description, userId, todoId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to update todo");
  }
  return mapRow(row)
};

export const getUserIdForTodoById = async (todoId: string) => {
  const result = await pool.query("SELECT user_id FROM todos WHERE id = $1", [todoId])
  return result.rows[0]?.user_id;
}