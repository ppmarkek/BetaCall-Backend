import { Router } from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getUsers,
  loginWithAppwriteAccount,
  verifyEmail,
  resendVerificationEmail,
  resetPassword,
  requestResetPassword,
  tokenResetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

// post
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/login/appwrite", loginWithAppwriteAccount);
router.post("/refresh", refreshToken);
router.post("/resend-verification", resendVerificationEmail);
router.post("/reset-password", isAuthenticated, resetPassword);
router.post("/request-reser-password", requestResetPassword);
router.post("/request-reser-password/:token", tokenResetPassword);

//get
router.get("/users", getUsers);
router.get("/verify/:token", verifyEmail);

export default router;
