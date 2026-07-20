import type { Request, Response } from "express";
import { insertNote, updateTodoService } from "../services/todoService.ts";

export const createNote = async (req: Request, res: Response) => {
  const result = await insertNote(req.body, req.user!.id);
  res.status(201).json(result);
};

export const updateTodo = async (req: Request, res: Response) => {
  const noteId = req.params.id as string;
  const result = await updateTodoService(req.body, req.user!.id, noteId);
  res.status(200).json(result);
};