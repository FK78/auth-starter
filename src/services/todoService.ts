import { saveTodo } from "../queries/todoQueries.ts";

export const insertNote = async ({ title, description, userId }) => {
  const result = await saveTodo(title, description, userId);
  return result
};
