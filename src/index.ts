import express from "express"
import userRouter from "./routes/authRouter.ts"
import { pool } from "./db/db.ts"

const port = process.env.TUDO_PORT || 3000
const app = express()

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

app.use("/", userRouter)

app.listen(port, () => {
  console.log(`Server is online at port ${port}`)
})