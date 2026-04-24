import crypto from "crypto";
import Batch from "../models/batch.model.js";
import appError from "../errors/appError.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import Log from "../models/log.model.js";

const sealBatch = asyncHandler(async (req, res) => {
  const batchId = req.body?.batchId;
  const producerId = req.body?.producerId;
  const items = req.body?.items;
  const locationObj = req.body?.locationObj;
  const timeStamp = req.body?.timeStamp;
  const originHash = req.body?.originHash;

  if (
    !locationObj ||
    locationObj.lat === undefined ||
    locationObj.lng === undefined
  ) {
    throw new appError(
      "GPS coordinates are required.",
      "LOCATION_INVALID",
      400,
    );
  }
  if (!batchId) {
    throw new appError("Invalid batch Id", "BATCHID_INVALID", 400);
  }
  if (!producerId) {
    throw new appError("Invalid producer Id", "PRODUCERID_INVALID", 400);
  }
  if (!items || !Array.isArray(items)) {
    throw new appError("Invalid items", "ITEMS_INVALID", 400);
  }
  if (!timeStamp) {
    throw new appError("Invalid Timestamps", "TIMESTAMPS_INVALID", 400);
  }
  if (!originHash) {
    throw new appError("Missing origin hash", "HASH_MISSING", 400);
  }

  const itemsString = JSON.stringify(items);
  const dataToHash = `${batchId}:${producerId}:${itemsString}:${locationObj.lat},${locationObj.lng}:${timeStamp}`;

  const calculatedHash = crypto
    .createHash("sha256")
    .update(dataToHash)
    .digest("hex");

  if (calculatedHash !== originHash) {
    throw new appError(
      "Data integrity compromised. Hash mismatch detected.",
      "TAMPERING_DETECTED",
      403,
    );
  }

  const newBatch = new Batch({
    batchId,
    producerId,
    items,
    location: locationObj,
    timeStamp,
    originHash,
  });

  await newBatch.save();

  return res.status(201).json({
    success: true,
    code: "BATCH_SEAL_SUCCESS",
    message: "Batch cryptographically sealed and verified.",
    data: {
      batchId,
      originHash,
    },
  });
});

const syncBatch = asyncHandler(async (req, res) => {
  const { logs } = req.body;

  if (!logs || !Array.isArray(logs)) {
    throw new appError("Invalid logs format", "LOGS_INVALID", 400);
  }

  const processedLogs = [];

  for (const log of logs) {
    const { batchId, scannedBy, location, timeStamp, logHash } = log;

    const batchExists = await Batch.exists({ batchId });
    if (!batchExists) continue;

    const dataToHash = `${batchId}:${scannedBy}:${location.lat},${location.lng}:${timeStamp}`;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(dataToHash)
      .digest("hex");

    const status = calculatedHash === logHash ? "Verified" : "Tampered";

    processedLogs.push({
      batchId,
      scannedBy,
      location,
      timeStamp,
      logHash,
      status,
    });
  }

  if (processedLogs.length > 0) {
    await Log.insertMany(processedLogs);
  }

  return res.status(200).json({
    success: true,
    code: "SYNC_SUCCESS",
    message: `Synced ${processedLogs.length} logs successfully`,
  });
});

const getBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const batchInfo = await Batch.findOne({ batchId });

  if (!batchInfo) {
    throw new appError("Batch not found in ledger", "BATCH_NOT_FOUND", 404);
  }

  const history = await Log.find({ batchId }).sort({ timeStamp: 1 });

  return res.status(200).json({
    success: true,
    code: "BATCH_FETCH_SUCCESS",
    data: {
      origin: batchInfo,
      journey: history,
    },
  });
});

export { sealBatch, syncBatch, getBatch };
