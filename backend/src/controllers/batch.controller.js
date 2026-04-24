import configs from "../config/index.js";

const sealBatch = async (req, res) => {
  const { batchId, producerId, items, location, timeStamp } = req.body;

  if (!location || location.lat === undefined || location.lng === undefined) {
    return res.status(400).json({
      success: false,
      message: "GPS coordinates are required.",
      code: "LOCATION_INVALID",
    });
  }
  if (!batchId) {
    return res.status(400).json({
      success: false,
      message: "Invalid batch Id",
      code: "BATCHID_INVALID",
    });
  }
  if (!producerId) {
    return res.status(400).json({
      success: false,
      message: "Invalid producer Id",
      code: "PRODUCERID_INVALID",
    });
  }
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: "Invalid items",
      code: "ITEMS_INVALID",
    });
  }
  if (!timeStamp) {
    return res.status(400).json({
      success: false,
      message: "Invalid Timestamps",
      code: "TIMESTAMPS_INVALID",
    });
  }
};

export { sealBatch };
