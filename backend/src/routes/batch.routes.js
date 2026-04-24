import express from "express";
import { sealBatch } from "../controllers/batch.controller.js";

const router = express.Router();

router.post("/seal", sealBatch);

export default router;
