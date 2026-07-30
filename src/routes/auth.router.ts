import express  from "express"
import { register, login, refresh } from "../controllers/auth.controller.ts"
import { validate } from "../middleware/validate.ts"
import { rateLimiter } from "../middleware/rateLimiter.ts"
import { loginSchema, refreshSchema, registerSchema } from "../schemas/auth.schema.ts"

const router = express.Router()
 
router.post("/register", rateLimiter(60000, 5), validate({ body: registerSchema }), register)
router.post("/login", validate({ body: loginSchema }), rateLimiter(60000, 5, (req) => (req.ip ?? "unknown") + ":" + (req.body.email ?? "unknown")), login)
router.post("/refresh", rateLimiter(60000, 10), validate({ body: refreshSchema}), refresh)


export default router