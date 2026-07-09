import express  from "express"
import { createUserController, getUserController } from "../controllers/userController.ts"
import { validate } from "../middleware/validate.ts"

const router = express.Router()

router.post("/register", validate(["name", "email", "password"]), createUserController)
router.post("/login", validate(["email", "password"]), getUserController)

export default router