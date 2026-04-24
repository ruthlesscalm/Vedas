import express from "express";
import {
  getBatch,
  sealBatch,
  syncBatch,
  getMyLogs,
} from "../controllers/batch.controller.js";
import {
  adminAccess,
  userAccess,
  logAccess,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/seal", userAccess, sealBatch);
router.post("/sync", userAccess, syncBatch);
router.get("/:batchID", userAccess, adminAccess, getBatch);
router.get("/logs/:username", userAccess, logAccess, getMyLogs);

export default router;
