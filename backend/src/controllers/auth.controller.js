import appError from "../errors/appError.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import configs from "../config/index.js";

const isProduction = configs.NODE_ENV === "production";

const normalize = (v) => v?.toLowerCase();
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  domain: isProduction ? ".ruthlesscalm.me" : "localhost",
};

const authRegister = asyncHandler(async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;
  const username = req.body?.username;

  if (!email || typeof email !== "string") {
    throw new appError("No email or invalid email", "AUTH_EMAIL_INVALID", 400);
  }
  if (!password || typeof password !== "string") {
    throw new appError(
      "No password or invalid password",
      "AUTH_PASSWORD_INVALID",
      400,
    );
  }
  if (!username || typeof username !== "string") {
    throw new appError(
      "No username or invalid username",
      "AUTH_USERNAME_INVALID",
      400,
    );
  }
  const normalisedEmail = normalize(email);
  const normalisedUsername = normalize(username);

  if (password.length < 8 || password.length > 72) {
    throw new appError(
      "Length of password should be between 8 and 72",
      "AUTH_PASSWORD_FORMAT_INVALID",
      400,
    );
  }
  const existingUser = await User.findOne({
    $or: [{ email: normalisedEmail }, { username: normalisedUsername }],
  });

  if (existingUser?.email === email) {
    return res.status(200).json({
      success: true,
      code: "AUTH_USER_ALREADY_REGISTERED",
      message: "User is already registered",
    });
  }
  if (existingUser?.username === username) {
    throw new appError(
      "username is already picked, pick another usename",
      "AUTH_USERNAME_TAKEN",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    email: normalisedEmail,
    username: normalisedUsername,
    password: hashedPassword,
    role: "user",
  });
  return res.status(200).json({
    success: true,
    code: "AUTH_REGISTER_SUCCESS",
    message: "You are successfully registered",
  });
});

const authLogin = asyncHandler(async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (!email || typeof email !== "string") {
    throw new appError("No email or invalid email", "INVALID_EMAIL", 400);
  }
  if (!password || typeof password !== "string") {
    throw new appError(
      "No password or invalid password",
      "AUTH_PASSWORD_INVALID",
      400,
    );
  }
  const normalisedEmail = normalize(email);

  const existingUser = await User.findOne({ email: normalisedEmail }).select(
    "+password",
  );

  if (!existingUser) {
    throw new appError("Invalid Email or Password", "AUTH_LOGIN_INVALID", 400);
  }
  const isPassword = await bcrypt.compare(password, existingUser.password);

  if (!isPassword) {
    throw new appError("Invalid Email or Password", "AUTH_LOGIN_INVALID", 400);
  }
  const accessToken = jwt.sign(
    {
      userID: existingUser._id,
      username: existingUser.username,
      role: existingUser.role,
    },
    process.env.JWT_ACCESS_TOKEN,
    {
      expiresIn: "15m",
    },
  );
  const refreshToken = jwt.sign(
    {
      userID: existingUser._id,
      username: existingUser.username,
      role: existingUser.role,
    },
    process.env.JWT_REFRESH_TOKEN,
    {
      expiresIn: "7d",
    },
  );
  return res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      success: true,
      code: "AUTH_LOGIN_SUCCESS",
      message: "User loggined successfully",
      username: existingUser.username,
      role: existingUser.role,
    });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new appError(
      "No Refresh Token found",
      "AUTH_REFRESH_TOKEN_INVALID",
      400,
    );
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN);
    const accessToken = jwt.sign(
      {
        userID: decoded.userID,
        username: decoded.username,
        role: decoded.role,
      },
      process.env.JWT_ACCESS_TOKEN,
      {
        expiresIn: "15m",
      },
    );

    return res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        code: "AUTH_TOKEN_REFRESH_SUCCESS",
        message: "Access Token refreshed successfully",
        username: decoded.username,
        role: decoded.role,
      });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({
        success: false,
        code: "AUTH_REFRESH_TOKEN_INVALID",
        message: "Invalid Refresh Token",
      });
    }
  }
});

const logout = asyncHandler(async (req, res) => {
  return res
    .clearCookie("accessToken", {
      ...cookieOptions,
    })
    .clearCookie("refreshToken", {
      ...cookieOptions,
    })
    .status(200)
    .json({
      success: true,
      code: "AUTH_LOGOUT_SUCCESS",
      message: "Logout successful",
    });
});

export { authRegister, authLogin, refreshAccessToken, logout };
