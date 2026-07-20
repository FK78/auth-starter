import { AppError } from "../errors/AppError.ts";
import { getUserIdForTodoById, saveTodo, update } from "../queries/todoQueries.ts";

export type Todo = {
  title: string;
  description: string;
};

export const insertNote = async ({ title, description }: Todo, userId: string) => {
  const result = await saveTodo(title, description, userId);
  return result
};

export const updateTodoService = async ({ title, description }: Todo, userId: string, noteId: string) => {
  const checkUserAccessForTodo = await getUserIdForTodoById(noteId)
  if (checkUserAccessForTodo === undefined) {
    throw new AppError("Todo does not exist", 404)
  }
  if (checkUserAccessForTodo !== userId) {
    throw new AppError("Forbidden", 403)
  }
  const result = await update(title, description, userId, noteId);
  return result
};