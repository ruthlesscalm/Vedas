import express from "express";
import {
  authRegister,
  authLogin,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", authRegister);
router.post("/login", authLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;
