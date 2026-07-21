import express from "express"
import authRouter from "./routes/authRouter.ts"
import todoRouter from "./routes/todoRouter.ts"
import { pool } from "./db/db.ts"
import { errorHandler, routeNotFound } from "./middleware/errorHandler.ts"
import { rateLimiter } from "./middleware/rateLimiter.ts"

const port = process.env.TUDO_PORT || 3000
const app = express()
const limit = 60 * 60 * 1000;
const maxTries = 30;

app.use(rateLimiter(limit, maxTries))
app.use(express.json())

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  throw new Error("Token secrets must be set")
}

try {
  await pool.query("SELECT 1");
  console.log("DB Connected");
} catch (err) {
  console.error(err);
  process.exit(1);
}

app.use("/", authRouter)
app.use("/", todoRouter)

app.use(routeNotFound)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server is online at port ${port}`)
})