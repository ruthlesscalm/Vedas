import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
  },
  scannedBy: {
    type: String,
    required: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  timeStamp: {
    type: String,
    required: true,
  },
  logHash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Verified", "Tampered"],
    default: "Verified",
  },
});

export default mongoose.model("Log", logSchema);
