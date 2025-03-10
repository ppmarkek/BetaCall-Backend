import { Router } from "express";
import multer from "multer";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  sendPrivateMessage,
  getPrivateMessages,
  createGroup,
  sendGroupMessage,
  getGroupMessages,
} from "../controllers/messageController.js";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.post(
  "/private",
  isAuthenticated,
  upload.array("files"),
  sendPrivateMessage
);
router.get("/private/:recipientId", isAuthenticated, getPrivateMessages);

router.post("/group", isAuthenticated, upload.array("files"), sendGroupMessage);
router.get("/group/:groupId", isAuthenticated, getGroupMessages);
router.post("/group/create", isAuthenticated, createGroup);

export default router;
