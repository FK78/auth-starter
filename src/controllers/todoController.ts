import type { Request, Response } from "express";
import { insertTodo, editTodo, removeTodo, getTodos, getTotalTodos } from "../services/todoService.ts";

export const createTodo = async (req: Request, res: Response) => {
  const result = await insertTodo(req.body, req.user!.id);
  res.status(201).json(result);
};

export const updateTodo = async (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const result = await editTodo(req.body, req.user!.id, noteId);
  res.status(200).json(result);
};

export const deleteTodo = async (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  await removeTodo(req.user!.id, noteId);
  res.status(204).end();
};

export const retrieveTodos = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await getTodos(req.user!.id, page, limit)
  const total = await getTotalTodos(req.user!.id)
  res.status(200).json({ data: result, page: page, limit: limit, total: parseInt(total) })
}