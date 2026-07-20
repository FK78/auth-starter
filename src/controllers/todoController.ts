import type { Request, Response } from "express";
import { insertTodo, editTodo } from "../services/todoService.ts";

export const createTodo = async (req: Request, res: Response) => {
  const result = await insertTodo(req.body, req.user!.id);
  res.status(201).json(result);
};

export const updateTodo = async (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const result = await editTodo(req.body, req.user!.id, noteId);
  res.status(200).json(result);
};