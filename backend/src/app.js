import express from "express";
import connectDB from "./database/db.js";
import batchRouter from "./routes/batch.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";

connectDB();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/batch", batchRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is Healthy",
  });
});

app.use(errorHandler);

export default app;
