import { Router } from "express";
import { createUser, loginUser } from "../controllers/userController.js";
// import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", createUser);
router.post("/login", loginUser);

export default router;
