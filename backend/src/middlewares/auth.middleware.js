import jwt from "jsonwebtoken";
import appError from "../errors/appError.js";

const userAccess = (req, res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken || typeof accessToken !== "string") {
    throw new appError(
      "No Access token or invalid accessToken",
      "AUTH_ACCESS_TOKEN_INVALID",
      401,
    );
  }
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN);
    req.user = decoded;
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        code: "AUTH_ACCESS_TOKEN_INVALID",
        message: "You are unathorized and you cannot enter here",
      });
    }
    next(err);
  }

  next();
};

const adminAccess = (req, res, next) => {
  const user = req.user;

  if (user.role !== "admin") {
    throw new appError(
      "you are forbidden from entering here",
      "AUTH_ACCESS_DENIED",
      403,
    );
  }
  next();
};

export { userAccess, adminAccess };
