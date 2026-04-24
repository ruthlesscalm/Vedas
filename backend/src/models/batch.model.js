import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
  },
  producerId: {
    type: String,
    required: true,
  },
  originLocation: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
    },
  ],
  originHash: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
});

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
