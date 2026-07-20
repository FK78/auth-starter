import { AppError } from "../errors/AppError.ts";
import {
  deleteTodo,
  getUserIdForTodoById,
  saveTodo,
  updateTodo,
} from "../queries/todoQueries.ts";

export type Todo = {
  title: string;
  description: string;
};

export const insertTodo = async (
  { title, description }: Todo,
  userId: string,
) => {
  const result = await saveTodo(title, description, userId);
  return result;
};

export const editTodo = async (
  { title, description }: Todo,
  userId: string,
  noteId: string,
) => {
  const checkUserAccessForTodo = await getUserIdForTodoById(noteId);
  if (checkUserAccessForTodo === undefined) {
    throw new AppError("Todo does not exist", 404);
  }
  if (checkUserAccessForTodo !== userId) {
    throw new AppError("Forbidden", 403);
  }
  const result = await updateTodo(title, description, userId, noteId);
  return result;
};

export const removeTodo = async (userId: string, noteId: string) => {
  const checkUserAccessForTodo = await getUserIdForTodoById(noteId);
  if (checkUserAccessForTodo === undefined) {
    throw new AppError("Todo does not exist", 404);
  }
  if (checkUserAccessForTodo !== userId) {
    throw new AppError("Forbidden", 403);
  }
  await deleteTodo(userId, noteId);
};
