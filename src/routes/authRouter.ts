import express  from "express"
import { createUserController, login } from "../controllers/authController.ts"
import { validate } from "../middleware/validate.ts"

const router = express.Router()

router.post("/register", validate(["name", "email", "password"]), createUserController)
router.post("/login", validate(["email", "password"]), login)
// router.post("/refresh", validate(["access_token", "refresh_token"]), getUserController)


export default router