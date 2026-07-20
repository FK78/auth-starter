import type { Request, Response } from "express";
import { insertNote } from "../services/todoService.ts";

export const createNote = async (req: Request, res: Response) => {
  const result = await insertNote(req.body, req.user!.id);
  res.status(201).json(result);
};
