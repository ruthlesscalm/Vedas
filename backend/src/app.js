import express from "express";
import connectDB from "./database/db.js";
import batchRouter from "./routes/batch.routes.js";

connectDB();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/batch", batchRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is Healthy",
  });
});

export default app;
