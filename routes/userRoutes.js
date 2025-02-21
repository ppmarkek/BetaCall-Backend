import { Router } from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getUsers,
} from "../controllers/userController.js";
// import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/users", getUsers);
router.post("/refresh", refreshToken);

export default router;
