import { Router } from "express";
import { googleLogin } from "../controllers/authGoogleController.js";
import { facebookLogin } from "../controllers/authFacebookController.js";
import {
  twitterLogin,
  twitterCallback,
} from "../controllers/authTwitterController.js";

const router = Router();

router.post("/google", googleLogin);

router.post("/facebook", facebookLogin);

router.get("/twitter/login", twitterLogin);
router.get("/twitter/callback", twitterCallback);

export default router;
