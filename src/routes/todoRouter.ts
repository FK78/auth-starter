import express from "express"
import { validate } from "../middleware/validate.ts"
import { createNote, updateTodo } from "../controllers/todoController.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = express.Router()

router.post("/todos", authenticate, validate(["title", "description"]), createNote)
router.put("/todos/:id", authenticate, validate(["title", "description"]), updateTodo)

export default router;