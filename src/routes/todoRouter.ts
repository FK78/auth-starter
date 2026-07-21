import express from "express"
import { validate } from "../middleware/validate.ts"
import { createTodo, deleteTodo, retrieveTodos, updateTodo } from "../controllers/todoController.ts";
import { authenticate } from "../middleware/authenticate.ts";

const router = express.Router()

router.post("/todos", authenticate, validate(["title", "description"]), createTodo)
router.put("/todos/:id", authenticate, validate(["title", "description"]), updateTodo)
router.delete("/todos/:id", authenticate, deleteTodo)
router.get("/todos", authenticate, retrieveTodos)

export default router;