import express from "express";
import connectDB from "./database/db.js";
import batchRouter from "./routes/batch.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import configs from "./config/index.js";

connectDB();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser());
const allowedOrigins = [
  "https://www.vedas.ruthlesscalm.me",
  "https://vedas.ruthlesscalm.me",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
