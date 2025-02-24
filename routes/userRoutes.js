import { Router } from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getUsers,
  loginWithAppwriteAccount,
  verifyEmail,
} from "../controllers/userController.js";
// import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/login/appwrite", loginWithAppwriteAccount);
router.get("/users", getUsers);
router.post("/refresh", refreshToken);
router.get("/verify/:token", verifyEmail);

export default router;
