import express from "express";
import { sealBatch } from "../controllers/batch.controller.js";

const router = express.Router();

router.get("/", sealBatch);

export default router;
