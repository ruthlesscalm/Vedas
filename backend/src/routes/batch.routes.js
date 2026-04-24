import express from "express";
import {
  getBatch,
  sealBatch,
  syncBatch,
} from "../controllers/batch.controller.js";

const router = express.Router();

router.post("/seal", sealBatch);
router.post("/sync", syncBatch);
router.get("/:batchID", getBatch);

export default router;
