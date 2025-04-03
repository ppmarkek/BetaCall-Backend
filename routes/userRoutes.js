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
  addContact,
  contactsUser,
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
router.post("/request-reset-password", requestResetPassword);
router.post("/request-reset-password/:token", tokenResetPassword);
router.post("/contacts", addContact);

//get
router.get("/users", getUsers);
router.get("/verify/:token", verifyEmail);
router.get("/contacts", contactsUser);

export default router;
