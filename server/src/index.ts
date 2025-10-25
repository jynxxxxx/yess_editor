import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env.local" });

import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat.js"

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
