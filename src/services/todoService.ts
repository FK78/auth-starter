import { AppError } from "../errors/AppError.ts";
import {
  deleteTodo,
  fetchTodos,
  getUserIdForTodoById,
  saveTodo,
  updateTodo,
} from "../queries/todoQueries.ts";

export type Todo = {
  title: string;
  description: string;
};

export type TodoFilters = {
  sort: string;
  order: string;
  title: string | undefined;
  description: string | undefined;
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

export const getTodos = async (
  userId: string,
  page: number,
  limit: number,
  { sort, order, title, description }: TodoFilters,
) => {
  return await fetchTodos(userId, page, limit, {
    sort,
    order,
    title,
    description,
  });
};
