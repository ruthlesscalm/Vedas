export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const messageCode = err.messageCode || "SERVER_ERROR";

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0];

    if (duplicateField === "email") {
      return res.status(200).json({
        success: true,
        code: "AUTH_REGISTER_SUCCESS",
        message:
          "A link to complete your registration has been sent to your email address.",
      });
    }
    if (duplicateField === "username") {
      return res.status(400).json({
        success: false,
        code: "AUTH_USERNAME_TAKEN",
        message: "Username is already picked, pick another username",
      });
    }

    if (duplicateField === "batchId") {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_BATCH",
        message: "This Batch ID has already been sealed.",
      });
    }

    return res.status(400).json({
      success: false,
      code: `DUPLICATE_${duplicateField.toUpperCase()}`,
      message: `${duplicateField} already exists.`,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      code: "AUTH_TOKEN_INVALID",
      message: "Invalid token",
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "AUTH_REFRESH_TOKEN_EXPIRED",
      message: "Refresh Token has expired",
    });
  }

  if (statusCode === 500) {
    console.error("Internal Server Error", {
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    code: messageCode,
    message:
      err.statusCode && err.message ? err.message : "Internal Server Error",
  });
};
