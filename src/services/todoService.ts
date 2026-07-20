import { saveTodo } from "../queries/todoQueries.ts";

export type Todo = {
  title: string;
  description: string;
};

export const insertNote = async ( { title, description } : Todo, userId: string) => {
  const result = await saveTodo(title, description, userId);
  return result
};
